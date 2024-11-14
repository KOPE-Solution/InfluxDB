# InfluxDB : Chapter-4 Write and query data using the Python

## Install Dependencies

First, you need to install the `influxdb-client` module. Run the command below in your terminal.

```shell
pip3 install influxdb-client
```

You’ll need to have [Python 3](https://www.python.org/download/releases/3.0/) installed.

## Get Tokens
InfluxDB Cloud uses Tokens to authenticate API access. We've created an all-access token for you for this set up process.
<br>
Run this command in your terminal to save your token as an environment variable:
```shell
export INFLUXDB_TOKEN=jFBfZFzgi4_PAY1_XUIlRi5St66PoLDpu04p7sm2Jp6h0Wi_A2YcRBgKtDCKA8X5ajqenCPDjqP8QMEt22_sNg==
```

Creating an all-access token is not the best security practice! We recommend you delete this token in the [Tokens page](http://localhost:8086/orgs/a69de975a69867a8/load-data/tokens) after setting up, and create your own token with a specific set of permissions later.


## Initialize Client
Run this command in your terminal to open the interactive Python shell:

```shell
python3
```

Paste the following code after the prompt (>>>) and press Enter.

```shell
import influxdb_client, os, time
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = os.environ.get("INFLUXDB_TOKEN")
org = "Enserv Power"
url = "http://localhost:8086"

write_client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)
```

Here, we initialize the token, organization info, and server url that are needed to set up the initial connection to InfluxDB. The client connection is then established with the InfluxDBClient initialization.

## Write Data
To start writing data, we need a place to store our time-series data. We call these [buckets](http://localhost:8086/orgs/a69de975a69867a8/load-data/buckets).

![01](/01.png)

Run the following code in your Nodejs shell:

```js
bucket="test_with_Python"

write_api = client.write_api(write_options=SYNCHRONOUS)
   
for value in range(5):
  point = (
    Point("measurement1")
    .tag("tagname1", "tagvalue1")
    .field("field1", value)
  )
  write_api.write(bucket=bucket, org="Enserv Power", record=point)
  time.sleep(1) # separate points by 1 second
```

In the above code snippet, we define five data points and write each one to InfluxDB. Each of the 5 points we write has a [field](https://docs.influxdata.com/influxdb/v2/reference/glossary/#field-key) and a [tag](https://docs.influxdata.com/influxdb/v2/reference/glossary/#tag-key).

![02](/02.png)

## Execute a Flux Query
Now let’s query the numbers we wrote into the database. We use the Flux scripting language to query data. Flux is designed for querying, analyzing, and acting on data.
<br>
Here is what a simple Flux query looks like on its own:
```shell
from(bucket: "test_with_NodeJS")
  |> range(start: -10m)
```

In this query, we are looking for data points within the last 10 minutes with a measurement of "measurement1".
<br>
Let’s use that Flux query in our Python code!
<br>
Run the following:

```py
query_api = client.query_api()

query = """from(bucket: "test_with_Python")
 |> range(start: -10m)
 |> filter(fn: (r) => r._measurement == "measurement1")"""
tables = query_api.query(query, org="Enserv Power")

for table in tables:
  for record in table.records:
    print(record)
```

![03](/03.png)

## Execute an Aggregate Query

[Aggregate functions](https://docs.influxdata.com/flux/v0/function-types/#aggregates) take the values of all rows in a table and use them to perform an aggregate operation. The result is output as a new value in a single-row table.

```shell
from(bucket: "test_with_NodeJS")
  |> range(start: -10m) # find data points in last 10 minutes
  |> mean()
```

In this example, we use the mean() function to calculate the average value of data points in the last 10 minutes.

Run the following:

```py
query_api = client.query_api()

query = """from(bucket: "test_with_Python")
  |> range(start: -10m)
  |> filter(fn: (r) => r._measurement == "measurement1")
  |> mean()"""
tables = query_api.query(query, org="Enserv Power")

for table in tables:
    for record in table.records:
        print(record)
```

This will return the mean of the five values. ( (0+1+2+3+4) / 5 = 2 )

![04](/04.png)

---