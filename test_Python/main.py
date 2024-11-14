import influxdb_client, os, time
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = '7g6T6JdOIf3kuVnwLaxUFqqsw3LDj8vIlmL6cVsY-Klp8VZr-c_CJSKyQQBWsOVYoLrFmUJnkfhmCPwAc_X4pw=='
org = "Enserv Power"
url = "http://localhost:8086"

write_client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)

# --------------- Write Data --------------- #

bucket = "test_with_Python"

write_api = write_client.write_api(write_options=SYNCHRONOUS)

for value in range(5):
  point = (
    Point("measurement1")
    .tag("tagname1", "tagvalue1")
    .field("field1", value)
  )
  write_api.write(bucket=bucket, org=org, record=point)
  time.sleep(1)  # separate points by 1 second


# --------------- Query Data --------------- #

# query_api = write_client.query_api()

# query = """from(bucket: "test_with_Python")
#  |> range(start: -10m)
#  |> filter(fn: (r) => r._measurement == "measurement1")"""
# tables = query_api.query(query, org="Enserv Power")

# for table in tables:
#   for record in table.records:
#     print(record)

# --------------- Execute an Aggregate Query --------------- #

query_api = write_client.query_api()

query = """from(bucket: "test_with_Python")
  |> range(start: -10m)
  |> filter(fn: (r) => r._measurement == "measurement1")
  |> mean()"""
tables = query_api.query(query, org="Enserv Power")

for table in tables:
    for record in table.records:
        print(record)