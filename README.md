# InfluxDB : Chapter-2 Write and query data using the Arduino (ESP32)

## Prepare Arduino IDE
<p>The easiest way to get started with the InfluxDB Arduino client is with the ESP32 board.</p>
<p>If you haven't already, add the board you wish to use ESP32 to the Arduino IDE by following these steps:</p>

1. Open the Arduino Preferences (Arduino → Preferences)
2. Look for "Additional Boards Manager URLs" input box and paste `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` in it.
3. Click OK.
4. Then under Tools → Boards: , click on Boards Manager.
5. Search for ESP32 in the boards.
6. Install the ESP32 board by ESP32 Community.

## Install Dependencies
<p>Install the required InfluxDB Client for Arduino library from the library manager</p>

1. Under Sketch → Include Libraries, click on Manage Libraries.
2. Search for `influxdb` in the search box.
3. Install `InfluxDB Client for Arduino` library.

Need to have [Arduino](https://www.arduino.cc/en/software) installed.

## Initialize Client
<p>Select or Create a bucket : A bucket is used to store time-series data.</p>

![01](/01.png)

### Configure an InfluxDB profile
<p>Next we'll need to configure the client and its initial connection to InfluxDB. InfluxDB Cloud uses Tokens to authenticate API access. We've created an all-access token for you for this set up process.</p>
<p>Paste the following snippet into a blank Arduino sketch file.</p>

```cpp
#if defined(ESP32)
  #include <WiFiMulti.h>
  WiFiMulti wifiMulti;
  #define DEVICE "ESP32"
  #elif defined(ESP8266)
  #include <ESP8266WiFiMulti.h>
  ESP8266WiFiMulti wifiMulti;
  #define DEVICE "ESP8266"
  #endif
  
  #include <InfluxDbClient.h>
  #include <InfluxDbCloud.h>
  
  // WiFi AP SSID
  #define WIFI_SSID "YOUR_WIFI_SSID"
  // WiFi password
  #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
  
  // Server Address
  #define INFLUXDB_URL "http://192.168.0.128:8086"
  #define INFLUXDB_TOKEN "fSO0wGPq_F8cbbyrnqGlQw0j9n2i6Ke12Er1rNCpG4efO6SeOgRhDPOngsB-xzjDqwHJ2NiUBN3eecpvyd-WVQ=="
  #define INFLUXDB_ORG "a69de975a69867a8"
  #define INFLUXDB_BUCKET "test_with_Arduino"
  
  // Time zone info
  #define TZ_INFO "UTC7"
  
  // Declare InfluxDB client instance with preconfigured InfluxCloud certificate
  InfluxDBClient client(INFLUXDB_URL, INFLUXDB_ORG, INFLUXDB_BUCKET, INFLUXDB_TOKEN, InfluxDbCloud2CACert);
  
  // Declare Data point
  Point sensor("wifi_status");
  
  void setup() {
    Serial.begin(115200);
  
    // Setup wifi
    WiFi.mode(WIFI_STA);
    wifiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);
  
    Serial.print("Connecting to wifi");
    while (wifiMulti.run() != WL_CONNECTED) {
      Serial.print(".");
      delay(100);
    }
    Serial.println();
  
    // Accurate time is necessary for certificate validation and writing in batches
    // We use the NTP servers in your area as provided by: https://www.pool.ntp.org/zone/
    // Syncing progress and the time will be printed to Serial.
    timeSync(TZ_INFO, "pool.ntp.org", "time.nis.gov");
  
  
    // Check server connection
    if (client.validateConnection()) {
      Serial.print("Connected to InfluxDB: ");
      Serial.println(client.getServerUrl());
    } else {
      Serial.print("InfluxDB connection failed: ");
      Serial.println(client.getLastErrorMessage());
    }
  }
  void loop() {}
```

Note: you will need to set the `WIFI_SSID` and `WIFI_PASSWORD` variables to the correct values for your wifi router.

## Write Data

To start writing data, append the lines of code to add tags to the Point at the end of the void `setup()` function.

```cpp
void setup() {
    // ... code in setup() from Initialize Client
   
    // Add tags to the data point
    sensor.addTag("device", DEVICE);
    sensor.addTag("SSID", WiFi.SSID());
   }
```

Add the following `loop()` code snippet to your sketch

```cpp
void loop() {
    // Clear fields for reusing the point. Tags will remain the same as set above.
    sensor.clearFields();
  
    // Store measured value into point
    // Report RSSI of currently connected network
    sensor.addField("rssi", WiFi.RSSI());
  
    // Print what are we exactly writing
    Serial.print("Writing: ");
    Serial.println(sensor.toLineProtocol());
  
    // Check WiFi connection and reconnect if needed
    if (wifiMulti.run() != WL_CONNECTED) {
      Serial.println("Wifi connection lost");
    }
  
    // Write point
    if (!client.writePoint(sensor)) {
      Serial.print("InfluxDB write failed: ");
      Serial.println(client.getLastErrorMessage());
    }
  
    Serial.println("Waiting 1 second");
    delay(1000);
    }
```

In the above code snippet, we retrive the RSSI (Received Signal Strength Indicator) of your wifi connection and write it to InfluxDB using the client.

```shell
Writing: wifi_status,device=ESP32,SSID=KopeSolution rssi=-48i
Waiting 1 second
Writing: wifi_status,device=ESP32,SSID=KopeSolution rssi=-48i
```

![02](/02.png)

## Review data concepts

### Field (required)
<p>
Key-value pair for storing time-series data. For example, insect name and its count. You can have one field per record (row of data), and many fields per bucket. <br>
key data type: string <br>
value data type: float, integer, string, or boolean
</p>


### Measurement (required)
<p>
A category for your fields. In our example, it is census. You can have one measurement per record (row of data), and many measurements per bucket. <br>
data type: string
</p>

### Tag (optional)
<p>
Key-value pair for field metadata. For example, census location. You can have many tags per record (row of data) and per bucket. <br>
key data type: string <br>
value data type: float, integer, string, or boolean
</p>

## Execute a Flux Query

Now let's query the data we wrote into the database. We use the Flux scripting language to query data. [Flux](https://docs.influxdata.com/influxdb/v2/reference/syntax/flux/) is designed for querying, analyzing, and acting on data.
<br>
Here's an example of a basic Flux script:

```shell
from(bucket: “weather-data”)
  |> range(start: -10m)
  |> filter(fn: (r) => r._measurement == “temperature”)
```

In this query, we are looking for data points within the last 1 minute with a measurement of `wifi_status`.

```cpp
void loop() {
    // ... code from Write Data step 
    
    // Query will find the RSSI values for last minute for each connected WiFi network with this device
     String query = "from(bucket: \"test_with_Arduino\")\n\
   |> range(start: -1m)\n\
   |> filter(fn: (r) => r._measurement == \"wifi_status\" and r._field == \"rssi\")";
   
     // Print composed query
     Serial.println("Querying for RSSI values written to the \"test_with_Arduino\" bucket in the last 1 min... ");
     Serial.println(query);
   
     // Send query to the server and get result
     FluxQueryResult result = client.query(query);
   
     Serial.println("Results : ");
     // Iterate over rows.
     while (result.next()) {
       // Get converted value for flux result column 'SSID'
       String ssid = result.getValueByName("SSID").getString();
       Serial.print("SSID '");
       Serial.print(ssid);
   
       Serial.print("' with RSSI ");
       // Get value of column named '_value'
       long value = result.getValueByName("_value").getLong();
       Serial.print(value);
   
       // Get value for the _time column
       FluxDateTime time = result.getValueByName("_time").getDateTime();
   
       String timeStr = time.format("%F %T");
   
       Serial.print(" at ");
       Serial.print(timeStr);
   
       Serial.println();
     }
   
     // Report any error
     if (result.getError() != "") {
       Serial.print("Query result error: ");
       Serial.println(result.getError());
     }
   
     // Close the result
     result.close();
   
     Serial.println("==========");
   
     delay(5000);
   }
```

## Execute a Flux Aggregate Query
[Aggregate functions](https://docs.influxdata.com/flux/v0/function-types/#aggregates) take the values of all rows in a table and use them to perform an aggregate operation. The result is output as a new value in a single-row table.
<br>
An aggregation is applied after the time range and filters, as seen in the example below.

```shell
from(bucket: "weather-data")
  |> range(start: -10m)
  |> filter(fn: (r) => r.measurement == "temperature")
  |> mean()
```

In this example, we use the mean() function to calculate the average value of data points in the last 1 minute.

```cpp
void loop() {
    // ... code from Write Data step
    
    // Query will find the min RSSI value for last minute for each connected WiFi network with this device
      String aggregate_query = "from(bucket: \"test_with_Arduino\")\n\
    |> range(start: -1m)\n\
    |> filter(fn: (r) => r._measurement == \"wifi_status\")\n\
    |> min()";
    
      // Print composed query
      Serial.println("Querying for the mean RSSI value written to the \"test_with_Arduino\" bucket in the last 1 min... ");
      Serial.println(aggregate_query);
    
      // Send query to the server and get result
      FluxQueryResult aggregate_result = client.query(aggregate_query);
    
      Serial.println("Result : ");
      // Iterate over rows.
      while (aggregate_result.next()) {
        // Get converted value for flux result column 'SSID'
        String ssid = aggregate_result.getValueByName("SSID").getString();
        Serial.print("SSID '");
        Serial.print(ssid);
    
        Serial.print("' with RSSI ");
        // Get value of column named '_value'
        long value = aggregate_result.getValueByName("_value").getLong();
        Serial.print(value);
    
        // Get value for the _time column
        FluxDateTime time = aggregate_result.getValueByName("_time").getDateTime();
    
        String timeStr = time.format("%F %T");
    
        Serial.print(" at ");
        Serial.print(timeStr);
    
        Serial.println();
      }
    
      // Report any error
      if (aggregate_result.getError() != "") {
        Serial.print("Query result error: ");
        Serial.println(aggregate_result.getError());
      }
    
      // Close the result
      aggregate_result.close();
    
      Serial.println("==========");
    
      delay(5000);
    
    }
```

![03](/03.png)

---