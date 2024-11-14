# InfluxDB : Chapter-3 Write and query data using the NodeJS

## Install Dependencies

First, you need to install the `@influxdata/influxdb-client` module. Run the command below in your terminal.

```shell
npm install --save @influxdata/influxdb-client
```

You’ll need to have [Node.js v14 LTS](https://nodejs.org/en/) or higher installed.

## Get Tokens
InfluxDB Cloud uses Tokens to authenticate API access. We've created an all-access token for you for this set up process.
<br>
Run this command in your terminal to save your token as an environment variable:
```shell
export INFLUXDB_TOKEN=brAwaP1sm5YBEdFVdO4lXTuAOqETiGJdXwFPBQbgtC5__Qj6KSBN1I52scG9OvscOsELobBXLQXNMeqYXhA9DQ==
```

Creating an all-access token is not the best security practice! We recommend you delete this token in the [Tokens page](http://localhost:8086/orgs/a69de975a69867a8/load-data/tokens) after setting up, and create your own token with a specific set of permissions later.


## Initialize Client
Run this command in your terminal to open the interactive Nodejs shell:

```shell
node
```

Paste the following code after the prompt (>) and press Enter.

```shell
repl.repl.ignoreUndefined=true

const {InfluxDB, Point} = require('@influxdata/influxdb-client')

const token = process.env.INFLUXDB_TOKEN
const url = 'http://localhost:8086'

const client = new InfluxDB({url, token})
```

Simple Query
Execute anAggregate Query
Finish
Initialize Client
Run this command in your terminal to open the interactive Nodejs shell:

node
Paste the following code after the prompt (>) and press Enter.

repl.repl.ignoreUndefined=true

const {InfluxDB, Point} = require('@influxdata/influxdb-client')

const token = process.env.INFLUXDB_TOKEN
const url = 'http://localhost:8086'

const client = new InfluxDB({url, token})
Here, we initialize the token, organization info, and server url that are needed to set up the initial connection to InfluxDB. The client connection is then established with the `InfluxDB` initialization.

## Write Data
To start writing data, we need a place to store our time-series data. We call these [buckets](http://localhost:8086/orgs/a69de975a69867a8/load-data/buckets).

![01](/01.png)

Run the following code in your Nodejs shell:

```js
let org = `Enserv Power`
let bucket = `test_with_NodeJS`

let writeClient = client.getWriteApi(org, bucket, 'ns')

for (let i = 0; i < 5; i++) {
  let point = new Point('measurement1')
    .tag('tagname1', 'tagvalue1')
    .intField('field1', i)

  void setTimeout(() => {
    writeClient.writePoint(point)
  }, i * 1000) // separate points by 1 second

  void setTimeout(() => {
    writeClient.flush()
  }, 5000)
}
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
Let’s use that Flux query in our Nodejs code!
<br>
Run the following:

```js
let queryClient = client.getQueryApi(org)
let fluxQuery = `from(bucket: "test_with_NodeJS")
 |> range(start: -10m)
 |> filter(fn: (r) => r._measurement == "measurement1")`

queryClient.queryRows(fluxQuery, {
  next: (row, tableMeta) => {
    const tableObject = tableMeta.toObject(row)
    console.log(tableObject)
  },
  error: (error) => {
    console.error('\nError', error)
  },
  complete: () => {
    console.log('\nSuccess')
  },
})
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

```js
queryClient = client.getQueryApi(org)
fluxQuery = `from(bucket: "test_with_NodeJS")
 |> range(start: -10m)
 |> filter(fn: (r) => r._measurement == "measurement1")
 |> mean()`

queryClient.queryRows(fluxQuery, {
  next: (row, tableMeta) => {
    const tableObject = tableMeta.toObject(row)
    console.log(tableObject)
  },
  error: (error) => {
    console.error('\nError', error)
  },
  complete: () => {
    console.log('\nSuccess')
  },
})
```

This will return the mean of the five values. ( (0+1+2+3+4) / 5 = 2 )

![04](/04.png)

---