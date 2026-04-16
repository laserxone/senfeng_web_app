 {/* <div
        ref={tableContainerRef}
        style={{ maxHeight: tableMaxHeight, overflowY: "auto" }}
      >
        <table className="border-collapse border border-gray-400 w-full table-fixed">
          <thead className="bg-red-600 text-white">
            <tr className="sticky top-0 z-30 bg-[#44546A]">
              <th
                colSpan={11}
                className="border border-gray-600 p-2 text-center font-semibold w-full"
              >
                <input
                  className="bg-transparent text-black dark:text-white dark:placeholder-gray-300"
                  style={{
                    borderColor: "transparent",
                    height: 35,
                    width: "100%",
                    fontWeight: 600,
                    fontSize: "19px",
                    color: "white",
                    textAlign: "center",
                  }}
                  onBlur={() => handleSaveShipment()}
                  value={apiData?.shipment || ""}
                  onChange={(e) =>
                    setApiData({ ...apiData, shipment: e.target.value })
                  }
                />
              </th>
            </tr>
            <tr className="sticky top-[51px] z-20 bg-red-600">
              {[
                "QTY",
                "SERIAL",
                "MODEL",
                "POWER",
                "SOURCE",
                "CUSTOMER",
                "CITY",
                "MANAGER",
                "PRICE",
                "DELIVERY",
                "REMARKS",
              ].map((item, index) => (
                <th
                  key={index}
                  className={`border border-gray-600 p-2 text-center font-semibold ${
                    item === "REMARKS" ? "w-[300px]" : "w-[130px]"
                  }`}
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data &&
              data.length > 0 &&
              data.map((item, ind) => (
                <tr key={ind} className={`${item.color}`}>
                  {fieldOrder.map((key, index1) => (
                    <td
                      key={`${ind}-${index1}`}
                      className={`border border-gray-600 dark:border-gray-400 ${
                        key === "REMARKS" ? "w-[300px]" : "w-[130px]"
                      } text-black dark:text-white`}
                    >
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <input
                            onFocus={() => setFocusedRow(ind)}
                            onBlur={(e) => {
                              if (
                                !e.relatedTarget ||
                                !tableRef.current.contains(e.relatedTarget)
                              ) {
                                setFocusedRow(null);
                                setFocusedBoard(false);
                              }
                            }}
                            className="bg-transparent text-black dark:text-white dark:placeholder-gray-300"
                            style={{
                              borderColor: "transparent",
                              height: 35,
                              width: "100%",
                              fontWeight: 600,
                              fontSize: "14px",
                              borderRadius: 0,
                              paddingInline: 5,
                            }}
                            value={item[key]}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              const parsedValue =
                                inputValue.trim() === ""
                                  ? ""
                                  : isNaN(inputValue)
                                  ? inputValue
                                  : Number(inputValue);

                              setData((prevState) => {
                                const newState = [...prevState];
                                newState[ind] = {
                                  ...newState[ind],
                                  [key]: parsedValue,
                                };
                                return newState;
                              });
                            }}
                          />
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => handleSameRowAbove(ind)}
                          >
                            Add same row above
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleSameRowBelow(ind)}
                          >
                            Add same row below
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div> */}