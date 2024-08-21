import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WaterTreatmentCostGraph = () => {
  const [waterUsage, setWaterUsage] = useState(5000);
  const [waterUsageUnit, setWaterUsageUnit] = useState('day');
  const [ppmSetPoint, setPpmSetPoint] = useState(5);
  const [productCost, setProductCost] = useState(25);
  const [acidCost, setAcidCost] = useState(18);
  const [months, setMonths] = useState(6);
  const [chartData, setChartData] = useState([]);
  const [yDomain, setYDomain] = useState([0, 10000]);
  const [totalWaterCleaned, setTotalWaterCleaned] = useState(0);
  const [edieProductUsed, setEdieProductUsed] = useState(0);
  const [edieAcidUsed, setEdieAcidUsed] = useState(0);
  const [aaneProductUsed, setAaneProductUsed] = useState(0);
  const [aaneAcidUsed, setAaneAcidUsed] = useState(0);
  const [hideCosts, setHideCosts] = useState(false);

  const maintenanceCost = 100;
  const pumpServiceCost = 400;

  const convertToGallonsPerDay = (value, unit) => {
    let gallonsPerDay;

    switch (unit) {
      case 'minute':
        gallonsPerDay = value * 60 * 16; // Assuming 16 hours per day for operational time
        break;
      case 'day':
        gallonsPerDay = value;
        break;
      case 'week':
        gallonsPerDay = value / 7;
        break;
      case 'month':
        gallonsPerDay = value / 30;
        break;
      default:
        gallonsPerDay = value;
    }

    return Math.round(gallonsPerDay); // Rounding to nearest integer
  };


  useEffect(() => {
    const calculateCosts = () => {
      const data = [];
      let edieCost = 2500 + 15 * productCost + 5 * acidCost;
      let aaneCost = 1500 + 15 * productCost + 5 * acidCost;
      let totalWaterCleaned = 0;
      let totalEdieProductUsed = 0;
      let totalEdieAcidUsed = 0;
      let totalAaneProductUsed = 0;
      let totalAaneAcidUsed = 0;
      let maxCost = Math.max(edieCost, aaneCost);
      let minCost = Math.min(edieCost, aaneCost);

      const waterPerDay = convertToGallonsPerDay(waterUsage, waterUsageUnit);

      data.push({
        month: 0,
        EDIE: edieCost,
        AANE: aaneCost,
      });

      for (let month = 1; month <= months; month++) {
        if (month % 6 === 0) {
          edieCost += pumpServiceCost;
          aaneCost += pumpServiceCost;
        }
        if (month % 3 === 0) {
          edieCost += maintenanceCost;
          aaneCost += maintenanceCost;
        }
        if (month % 2 === 0) {
          aaneCost += maintenanceCost;
        }

        const daysInMonth = 30;
        const waterTreatedPerMonth = waterPerDay * daysInMonth;
        totalWaterCleaned += waterTreatedPerMonth;

        const edieProductUsedThisMonth = (waterTreatedPerMonth * ppmSetPoint) / (50000 * .65);
        const edieAcidUsedThisMonth = edieProductUsedThisMonth / 10;

        const aaneProductUsedThisMonth = (waterTreatedPerMonth * ppmSetPoint) / (50000 * .40);
        const aaneAcidUsedThisMonth = aaneProductUsedThisMonth / 5;

        totalEdieProductUsed += edieProductUsedThisMonth;
        totalEdieAcidUsed += edieAcidUsedThisMonth;
        totalAaneProductUsed += aaneProductUsedThisMonth;
        totalAaneAcidUsed += aaneAcidUsedThisMonth;

        edieCost += edieProductUsedThisMonth * productCost + edieAcidUsedThisMonth * acidCost;
        aaneCost += aaneProductUsedThisMonth * productCost + aaneAcidUsedThisMonth * acidCost;

        maxCost = Math.max(maxCost, edieCost, aaneCost);
        minCost = Math.min(minCost, edieCost, aaneCost);

        data.push({
          month,
          EDIE: Math.round(edieCost),
          AANE: Math.round(aaneCost),
        });
      }

      setTotalWaterCleaned(totalWaterCleaned);
      setEdieProductUsed(totalEdieProductUsed);
      setEdieAcidUsed(totalEdieAcidUsed);
      setAaneProductUsed(totalAaneProductUsed);
      setAaneAcidUsed(totalAaneAcidUsed);

      const yMax = Math.ceil(maxCost * 1.1);
      const yMin = Math.floor(minCost * 0.9);
      setYDomain([yMin, yMax]);
      return data;
    };

    setChartData(calculateCosts());
  }, [waterUsage, waterUsageUnit, ppmSetPoint, productCost, acidCost, months]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const edieCost = payload[0]?.value;
      const aaneCost = payload[1]?.value;
      
      if (edieCost === undefined || aaneCost === undefined) {
        console.error("Undefined cost values in tooltip:", { edieCost, aaneCost });
        return null;
      }

      const difference = edieCost - aaneCost;
      const differenceColor = difference > 0 ? 'text-red-500' : 'text-green-500';

      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">Month: {label}</p>
          {!hideCosts && (
            <>
              <p className="text-purple-600">EDIE: ${edieCost.toLocaleString()}</p>
              <p className="text-orange-600">AANE: ${aaneCost.toLocaleString()}</p>
            </>
          )}
          <p className={differenceColor}>
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

  const formatNumber = (num) => {
    if (num % 1 === 0) return num.toString();
    return num.toFixed(2).replace(/\.?0+$/, '');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">EDIE vs AANE System Cost Analyzer</h1>
      
      {/* Responsive grid for inputs */}
      <div className="grid grid-cols-3 md:grid-cols-4">
        <InputField
          id="waterUsage"
          label="Water Consumption"
          value={waterUsage}
          onChange={(e) => setWaterUsage(Number(e.target.value))}
        />
        <div>
          <label htmlFor="waterUsageUnit" className="block text-sm font-medium text-gray-700 mb-1">Gallons Used Per</label>
          <select
            id="waterUsageUnit"
            value={waterUsageUnit}
            onChange={(e) => setWaterUsageUnit(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="minute">Minute</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        <InputField
          id="ppmSetPoint"
          label="PPM Free Target"
          value={ppmSetPoint}
          onChange={(e) => setPpmSetPoint(Number(e.target.value))}
        />
        <InputField
          id="productCost"
          label="Product Cost per Gallon ($)"
          value={productCost}
          onChange={(e) => setProductCost(Number(e.target.value))}
        />
        <InputField
          id="acidCost"
          label="Acid Cost per Gallon ($)"
          value={acidCost}
          onChange={(e) => setAcidCost(Number(e.target.value))}
        />
		</div>
		<div>
        <div className="col-span-1 sm:col-span-2">
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

      {waterUsageUnit === 'minute' && (
        <div className="mb-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          <p className="font-bold">Note:</p>
          <p>Gallons per Minute (GPM) calculations assume a 16-hour operational day, as water flow is minimal during nighttime hours.</p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
          <YAxis 
            domain={yDomain} 
            label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', offset: 0 }} 
            tickFormatter={hideCosts ? (value) => '' : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="EDIE" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="AANE" stroke="#ffa500" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">EDIE</h3>
          <p>Product Used: {formatNumber(edieProductUsed)} gallons</p>
          <p>Acid Used: {formatNumber(edieAcidUsed)} gallons</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700">AANE</h3>
          <p>Product Used: {formatNumber(aaneProductUsed)} gallons</p>
          <p>Acid Used: {formatNumber(aaneAcidUsed)} gallons</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Total Water Cleaned: {totalWaterCleaned.toLocaleString()} gallons
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="hideCosts"
            checked={hideCosts}
            onChange={(e) => setHideCosts(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600 rounded mr-2"
          />
        </div>
        <p className="text-sm text-gray-600 text-center">
          *Differences in service, acid, and conversion requirements are accounted for*
        </p>
      </div>
    </div>
  );
};

export default WaterTreatmentCostGraph;
