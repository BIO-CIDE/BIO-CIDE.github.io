import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WaterTreatmentCostGraph = () => {
  const [waterPerDay, setWaterPerDay] = useState(20000);
  const [ppmSetPoint, setPpmSetPoint] = useState(5);
  const [productCost, setProductCost] = useState(25);
  const [months, setMonths] = useState(12);
  const [maintenanceCost, setMaintenanceCost] = useState(150);
  const [pumpServiceCost, setPumpServiceCost] = useState(500);
  const [chartData, setChartData] = useState([]);
  const [yDomain, setYDomain] = useState([0, 10000]);

  useEffect(() => {
    const calculateCosts = () => {
      const data = [];
      let edieCost = 2500;
      let aaneCost = 1500;
      let totalWaterCleaned = 0;
      let maxCost = 0;
      let minCost = Infinity;

      for (let month = 0; month <= months; month++) {
        if (month % 6 === 0 && month !== 0) {
          edieCost += pumpServiceCost;
          aaneCost += pumpServiceCost;
        }
        if (month % 3 === 0 && month !== 0) {
          edieCost += maintenanceCost;
          aaneCost += maintenanceCost;
        }
        if (month % 2 === 0 && month !== 0) {
          aaneCost += maintenanceCost;
        }

        const daysInMonth = 30;
        const waterTreatedPerMonth = waterPerDay * daysInMonth;
        totalWaterCleaned += waterTreatedPerMonth;

        const edieProductUsed = (waterTreatedPerMonth * ppmSetPoint) / (50000 * 6);
        const aaneProductUsed = (waterTreatedPerMonth * ppmSetPoint) / (50000 * 4);

        edieCost += edieProductUsed * productCost;
        aaneCost += aaneProductUsed * productCost;

        const roundedEdieCost = Math.round(edieCost);
        const roundedAaneCost = Math.round(aaneCost);

        maxCost = Math.max(maxCost, roundedEdieCost, roundedAaneCost);
        minCost = Math.min(minCost, roundedEdieCost, roundedAaneCost);

        data.push({
          month,
          EDIE: roundedEdieCost,
          AANE: roundedAaneCost,
          waterCleaned: Math.round(totalWaterCleaned),
        });
      }

      const yMax = Math.ceil(maxCost * 1.1);
      const yMin = Math.floor(minCost * 0.9);
      setYDomain([yMin, yMax]);
      return data;
    };

    setChartData(calculateCosts());
  }, [waterPerDay, ppmSetPoint, productCost, months, maintenanceCost, pumpServiceCost]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const edieCost = payload[0]?.value;
      const aaneCost = payload[1]?.value;
      
      if (edieCost === undefined || aaneCost === undefined) {
        console.error("Undefined cost values in tooltip:", { edieCost, aaneCost });
        return null;
      }

      const difference = edieCost - aaneCost;
      const differenceColor = difference > 0 ? 'red' : 'green';

      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">Month: {label}</p>
			  {/*           <p style={{ color: '#8884d8' }}>EDIE: ${edieCost.toLocaleString()}</p>
			  <p style={{ color: '#82ca9d' }}>AANE: ${aaneCost.toLocaleString()}</p> */}
          <p style={{ color: differenceColor }}>
            Difference: ${Math.abs(difference).toLocaleString()} 
            ({difference > 0 ? 'EDIE costs more' : 'EDIE costs less'})
          </p>
        </div>
      );
    }
    return null;
  };

  const InputField = ({ id, label, value, onChange, type = 'number' }) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Water Treatment System Cost Analyzer</h1>
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">EDIE vs AANE</h2>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <InputField
          id="waterPerDay"
          label="Water per day (gallons)"
          value={waterPerDay}
          onChange={(e) => setWaterPerDay(Number(e.target.value))}
        />
        <InputField
          id="ppmSetPoint"
          label="Free PPM Target"
          value={ppmSetPoint}
          onChange={(e) => setPpmSetPoint(Number(e.target.value))}
        />
        <InputField
          id="productCost"
          label="Cost per gallon of PRODUCT ($)"
          value={productCost}
          onChange={(e) => setProductCost(Number(e.target.value))}
        />
        <InputField
          id="maintenanceCost"
          label="Cost per Maintenance Event ($)"
          value={maintenanceCost}
          onChange={(e) => setMaintenanceCost(Number(e.target.value))}
        />
        <InputField
          id="pumpServiceCost"
          label="Cost per Pump Service Event ($)"
          value={pumpServiceCost}
          onChange={(e) => setPumpServiceCost(Number(e.target.value))}
        />
        <div>
          <label htmlFor="months" className="block text-sm font-medium text-gray-700 mb-1">Months to Calculate: {months}</label>
          <input
            id="months"
            type="range"
            min={1}
            max={60}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="mb-6 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Total Water Cleaned: {chartData[chartData.length - 1]?.waterCleaned.toLocaleString()} gallons
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
          <YAxis domain={yDomain} label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', offset: 0 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="EDIE" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="AANE" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
	  <p className="mt-4 text-center text-sm text-gray-600">
      This graph assumes AANE conversion at 40% and EDIE at 65%<br />
      This graph does not account for additional savings from decreased acid usage
	  </p>
	</div>
  );
};

export default WaterTreatmentCostGraph;