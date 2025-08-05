export default function Spreadsheet({ tableData }: { tableData: any[] }) {
    
    const headers = Object.keys(tableData[0])
    const body = tableData.slice(1)

    return (
        <div className="h-full overflow-x-auto border border-gray-200 border-collapse">
            <table className="w-full">
                <thead className="sticky top-0 bg-gray-100 shadow-sm shadow-gray-200">
                    <tr className="font-medium">
                        <th className="bg-gray-100" key={0}></th>
                        {headers.map((header, index) => (
                            <th className="px-1 border-l border-gray-200" key={index + 1}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {body.map((row, index) => (
                        <tr key={index}>
                            <th className="bg-gray-100 border border-gray-200 text-gray-700 font-medium" key={0}>{index + 1} </th>
                            {Object.values(row as Record<string, any>).map((value, i) => (
                                <td 
                                    className={`px-2 border border-gray-200 ${!isNaN(Number(value)) ? 'text-right' : ''}`} 
                                    key={i + 2}
                                >
                                    {value}
                                </td>
                            ))}
                        </tr> 
                    ))}
                </tbody>
            </table>
        </div>
    )
}