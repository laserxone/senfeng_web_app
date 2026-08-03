import { publicFile } from "@/lib/publicFile"
import { Document, Image, Page, Text, View } from "@react-pdf/renderer"

const InvoicePDFGatepass = ({
  from,
  vehicle_no,
  driver_name,
  manager,
  received_by,
  gatepass,
  gatepassType,
  items,
  created_at,
}: {
  from: string
  vehicle_no: string
  driver_name: string
  manager: string
  received_by: string
  gatepass: string
  gatepassType: string
  items: any[]
  created_at?: string
}) => {
  let now = new Date()
  if (created_at) {
    now = new Date(created_at)
  }

  const date = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return (
    <Document>
      <Page style={{ padding: 20, width: "100%" }}>
        <Header gatepassType={gatepassType} />

        <View
          style={{
            padding: "5px",
            borderWidth: 2,
            borderColor: "#0072BC",
            borderRadius: 20,
            paddingTop: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
              width: "100%",
              display: "flex",
            }}
          >
            <View style={{ rowGap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: "#0072BC",
                  fontFamily: "Helvetica-Bold",
                  marginLeft: 10,
                }}
              >
                Gate Pass No: {gatepass || ""}
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  color: "#0072BC",
                  fontFamily: "Helvetica-Bold",
                  marginLeft: 10,
                }}
              >
                Date: {date || ""}
              </Text>
            </View>

            <CompanyDetails />
          </View>

          <FormField
            from={from}
            vehicle_no={vehicle_no}
            driver_name={driver_name}
            manager={manager}
            received_by={received_by}
            time={time}
          />

          <View style={{ width: "100%" }}>
            <View style={{ width: "100%" }}>
              {/* Table Header */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#0072BC",
                  border: "1px solid #D1D5DB",
                }}
              >
                {["Sr.", "Name", "Quantity", "Unit", "Remarks"].map(
                  (header, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === 0 ? 30 : i === 1 ? 200 : 100,
                        justifyContent: "center",
                        paddingLeft: 5,
                        height: 25,
                        borderLeftWidth: i !== 0 ? 1 : 0,
                        borderLeftColor: "#D1D5DB",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: "white",
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        {header}
                      </Text>
                    </View>
                  )
                )}
              </View>

              {Array.from({ length: 15 }).map((_, index) => {
                const item = items[index] || {
                  name: "",
                  qty: "",
                  unit: "",
                  remarks: "",
                }
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      backgroundColor: index % 2 === 0 ? "#f1f1f1" : "white",
                      border: "1px solid #D1D5DB",
                      borderTopWidth: index === 0 ? 1 : 0,
                    }}
                  >
                    <Cell width={30} value={index + 1} />
                    <Cell width={200} value={item.name} />
                    <Cell width={100} value={item.qty} />
                    <Cell width={100} value={item.unit} />
                    <Cell width={100} value={item.remarks} />
                  </View>
                )
              })}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              width: "100%",
              marginTop: 30,
              marginBottom: 10,
              paddingHorizontal: 10,
            }}
          >
            <View style={{ width: "50%", marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 10, marginRight: 5 }}>
                  Branch Manager’s Signature:
                </Text>
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: "#000",
                    width: 120,
                    height: 10,
                  }}
                />
              </View>
            </View>

            <View style={{ width: "50%", marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 10, marginRight: 5 }}>
                  Receiver’s Signature:
                </Text>
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: "#000",
                    width: 120,
                    height: 10,
                  }}
                />
              </View>
            </View>

            <View style={{ width: "50%", marginTop: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 10, marginRight: 5 }}>
                  Gate In-charge’s Signature:
                </Text>
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: "#000",
                    width: 120,
                    height: 10,
                  }}
                />
              </View>
            </View>
          </View>

          {/* <Disclaimer /> */}
        </View>

        <Footer />
      </Page>
    </Document>
  )
}

const Cell = ({ width, value }: { width: number; value: string | number }) => (
  <View
    style={{
      width,
      height: 20,
      justifyContent: "center",
      paddingLeft: 5,
      borderLeftWidth: 1,
      borderLeftColor: "#D1D5DB",
    }}
  >
    <Text style={{ fontSize: 10 }}>{value ?? ""}</Text>
  </View>
)

const FormField = ({
  from,
  vehicle_no,
  driver_name,
  manager,
  received_by,
  time,
}: {
  from: string
  vehicle_no: string
  driver_name: string
  manager: string
  received_by: string
  time: string
}) => {
  const fields = [
    { label: "From", value: from },
    { label: "Vehicle No", value: vehicle_no },
    { label: "Driver Name", value: driver_name },
    { label: "Manager", value: manager },
    { label: "Received By", value: received_by },
    { label: "Time", value: time },
  ]

  return (
    <View style={{ marginBottom: 10 }}>
      {Array.from({ length: Math.ceil(fields.length / 2) }).map((_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          {fields.slice(row * 2, row * 2 + 2).map((f, i) => (
            <View key={i} style={{ width: "48%" }}>
              <Text
                style={{
                  fontSize: 11,
                  color: "#7F7F7F",
                  fontFamily: "Helvetica-Bold",
                  marginLeft: 10,
                }}
              >
                {f.label}:
              </Text>
              <View
                style={{
                  backgroundColor: "#dce4f1",
                  height: 20,
                  justifyContent: "center",
                  paddingLeft: 10,
                  border: "1px solid #E5E7EB",
                }}
              >
                <Text style={{ fontSize: 11 }}>{f.value}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const CompanyDetails = () => (
  <View style={{ alignItems: "flex-end", marginRight: 10 }}>
    <Text
      style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0072BC" }}
    >
      SENFENG PAKISTAN
    </Text>
    <Text style={{ fontSize: 10, color: "#7F7F7F" }}>
      Street# 2, Sharif Garden Daroghawala
    </Text>
    <Text style={{ fontSize: 10, color: "#7F7F7F" }}>
      Lahore, Punjab 54000, Pakistan
    </Text>
    <Text style={{ fontSize: 10, color: "#7F7F7F" }}>
      senfenglaserpakistan@gmail.com
    </Text>
  </View>
)

const Header = ({ gatepassType }: { gatepassType: string }) => (
  <View
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexDirection: "row",
    }}
  >
    {/* <Text fontSize={60} color={'#0072BC'} fontWeight={'800'}>SENFENG</Text> */}
    <Image
      src={publicFile("/logo.png")}
      style={{ height: "40px", width: "200px" }}
    />
    <View
      style={{
        backgroundColor: "#0072BC",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginRight: 70,
        width: "150px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: "15px",
          fontFamily: "Helvetica-Bold",
          color: "white",
        }}
      >
        {gatepassType}
      </Text>
    </View>
  </View>
)

const Disclaimer = () => (
  <View style={{ marginTop: 10, alignItems: "center" }}>
    <Text style={{ fontSize: 10, color: "#0072BC" }}>
      DISCLAIMER: This is an auto generated Gate Pass and does not require a
      signature.
    </Text>
  </View>
)

const Footer = () => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    }}
  >
    <Text style={{ fontSize: 10, color: "#0072BC" }}>+92 333 9180410</Text>
    <Text style={{ fontSize: 10, color: "#0072BC" }}>
      www.senfenglaserpk.com
    </Text>
  </View>
)

export default InvoicePDFGatepass
