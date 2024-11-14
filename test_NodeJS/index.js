const {InfluxDB, Point} = require('@influxdata/influxdb-client')

const token = 'brAwaP1sm5YBEdFVdO4lXTuAOqETiGJdXwFPBQbgtC5__Qj6KSBN1I52scG9OvscOsELobBXLQXNMeqYXhA9DQ=='
const url = 'http://localhost:8086'

const client = new InfluxDB({url, token})

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

// -----------------------------------------------------
// Execute a Flux Query

// let queryClient = client.getQueryApi(org)
// let fluxQuery = `from(bucket: "test_with_NodeJS")
//  |> range(start: -10m)
//  |> filter(fn: (r) => r._measurement == "measurement1")`

// queryClient.queryRows(fluxQuery, {
//   next: (row, tableMeta) => {
//     const tableObject = tableMeta.toObject(row)
//     console.log(tableObject)
//   },
//   error: (error) => {
//     console.error('\nError', error)
//   },
//   complete: () => {
//     console.log('\nSuccess')
//   },
// })

// -----------------------------------------------------
// Execute an Aggregate Quer

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