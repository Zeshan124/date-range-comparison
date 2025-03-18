"use client";

import { useState, useEffect, Suspense } from "react";
import { DatePicker, Card, Typography, Space } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { Bar } from "@ant-design/plots";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dayjs from "dayjs";
import "antd/dist/reset.css";
import mockOrders from "./data/mockOrders";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function Home() {
  const [currentRange, setCurrentRange] = useState(null);
  const [comparisonRange, setComparisonRange] = useState(null);
  const [selectedChartData, setSelectedChartData] = useState([]);
  const [comparisonChartData, setComparisonChartData] = useState([]);
  const [comparisonType, setComparisonType] = useState("month");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (startDate && endDate) {
      const start = dayjs(startDate);
      const end = dayjs(endDate);

      if (start.isValid() && end.isValid()) {
        setCurrentRange([start, end]);
        calculateComparisonRange([start, end]);
      }
    }
  }, [comparisonType]);

  const calculateComparisonRange = (dates) => {
    if (!dates || dates.length !== 2) return;
    const [startDate, endDate] = dates;
    const start = startDate.toDate();
    const end = endDate.toDate();

    let comparisonStart, comparisonEnd;

    if (comparisonType === "month") {
      if (
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear()
      ) {
        // Previous month ka comparison
        comparisonStart = new Date(start);
        comparisonEnd = new Date(end);
        comparisonStart.setMonth(start.getMonth() - 1);
        comparisonEnd.setMonth(end.getMonth() - 1);

        if (start.getMonth() === 0) {
          comparisonStart.setFullYear(start.getFullYear() - 1);
          comparisonEnd.setFullYear(end.getFullYear() - 1);
        }

        if (start.getMonth() === 1 && end.getMonth() === 1) {
          comparisonStart.setDate(1);
          comparisonEnd.setDate(31);
        }
      } else if (start.getDate() === 1 && start.getMonth() === 0) {
        // Previous year Dec to equivalent period
        comparisonStart = new Date(start);
        comparisonEnd = new Date(end);
        comparisonStart.setFullYear(start.getFullYear() - 1);
        comparisonStart.setMonth(11);
        comparisonEnd.setFullYear(end.getFullYear() - 1);

        if (end.getMonth() === 0) {
          comparisonEnd.setMonth(11);
        } else {
          comparisonEnd.setMonth(end.getMonth() - 1);
        }
      } else if (start.getFullYear() === end.getFullYear()) {
        // **Updated Logic** for Same Month Previous Year Comparison
        comparisonStart = new Date(start);
        comparisonEnd = new Date(end);
        comparisonStart.setFullYear(start.getFullYear() - 1); // Set to last year
        comparisonEnd.setFullYear(end.getFullYear() - 1); // Set to last year
      }
    } else if (comparisonType === "year") {
      // Previous year ka comparison logic
      comparisonStart = new Date(start);
      comparisonEnd = new Date(end);
      comparisonStart.setFullYear(start.getFullYear() - 1);
      comparisonEnd.setFullYear(end.getFullYear() - 1);
    }

    setComparisonRange([comparisonStart, comparisonEnd]);
    generateChartData(start, end, comparisonStart, comparisonEnd);
  };

  const generateChartData = (currentStart, currentEnd, compStart, compEnd) => {
    const selectedData = [];
    const comparisonData = [];

    let currentDate = new Date(currentStart);
    let compDate = new Date(compStart);

    let dayCount = 1;

    while (currentDate <= currentEnd) {
      const currentKey = currentDate.toISOString().split("T")[0];
      const compKey = compDate.toISOString().split("T")[0];

      const dateLabel = `Day ${dayCount}`;

      selectedData.push({
        date: dateLabel,
        actualDate: currentDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        value: mockOrders[currentKey] || 0,
      });

      comparisonData.push({
        date: dateLabel,
        actualDate: compDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        value: mockOrders[compKey] || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
      compDate.setDate(compDate.getDate() + 1);
      dayCount++;
    }

    setSelectedChartData(selectedData);
    setComparisonChartData(comparisonData);
  };

  const handleDateChange = (dates) => {
    setCurrentRange(dates);

    if (dates && dates.length === 2) {
      const params = new URLSearchParams(searchParams);

      const startDateStr = dates[0].format("YYYY-MM-DD");
      const endDateStr = dates[1].format("YYYY-MM-DD");

      params.set("startDate", startDateStr);
      params.set("endDate", endDateStr);

      router.replace(`${pathname}?${params.toString()}`);
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete("startDate");
      params.delete("endDate");
      router.replace(`${pathname}?${params.toString()}`);
    }

    calculateComparisonRange(dates);
  };

  const formatDate = (date) => {
    return date
      ? date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "N/A";
  };

  // Bar chart configuration for selected range
  const selectedChartConfig = {
    data: selectedChartData,
    xField: "date",
    yField: "value",
    color: "#3b82f6", // Professional blue
    barWidthRatio: 0.6,
    label: {
      position: "top",
      style: { fill: "#1e293b", fontWeight: 500 },
    },
    xAxis: {
      label: { autoRotate: false, style: { fill: "#64748b" } },
    },
    yAxis: {
      grid: { line: { style: { stroke: "#e2e8f0" } } },
      label: { style: { fill: "#64748b" } },
    },
    meta: {
      value: { alias: "Orders" },
    },
    animation: {
      appear: { animation: "grow-in-y", duration: 600 },
    },
  };

  // Bar chart configuration for comparison range
  const comparisonChartConfig = {
    data: comparisonChartData,
    xField: "date",
    yField: "value",
    color: "#10b981",
    barWidthRatio: 0.6,
    label: {
      position: "top",
      style: { fill: "#1e293b", fontWeight: 500 },
    },
    xAxis: {
      label: { autoRotate: false, style: { fill: "#64748b" } },
    },
    yAxis: {
      grid: { line: { style: { stroke: "#e2e8f0" } } },
      label: { style: { fill: "#64748b" } },
    },
    meta: {
      value: { alias: "Orders" },
    },
    animation: {
      appear: { animation: "grow-in-y", duration: 600 },
    },
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        style={{
          padding: "40px",
          maxWidth: "100%",
          margin: "0 auto",
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%)",
          minHeight: "100vh",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            marginBottom: "40px",
            padding: "32px",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Title
            level={2}
            style={{
              color: "#1e293b",
              marginBottom: "12px",
              fontWeight: 700,
              fontSize: "28px",
            }}
          >
            Orders Comparison Dashboard
          </Title>
          <Text style={{ color: "#64748b", fontSize: "16px" }}>
            Gain insights into order trends with custom date range analysis
          </Text>
        </div>

        {/* Date Picker Section */}
        <Space
          direction="vertical"
          size={32}
          style={{
            width: "100%",
            marginBottom: "40px",
          }}
        >
          <div>
            <Text
              strong
              style={{
                display: "block",
                marginBottom: "16px",
                color: "#475569",
                fontSize: "16px",
              }}
            >
              Select Date Range:
            </Text>
            <DatePicker.RangePicker
              value={currentRange}
              onChange={handleDateChange}
              format="DD MMM YYYY"
              placeholder={["Start Date", "End Date"]}
              suffixIcon={<CalendarOutlined />}
              style={{
                width: "360px",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
              popupStyle={{
                borderRadius: "10px",
              }}
            />

            <Space direction="vertical" size={16}>
              {/* <Text strong>Select Comparison Type:</Text> */}
              <select
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <option value="month">Previous Month</option>
                <option value="year">Previous Year</option>
              </select>
            </Space>
          </div>
        </Space>

        {/* Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            marginBottom: "40px",
          }}
        >
          <Card
            title="Selected Range"
            style={{
              borderRadius: "16px",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
              border: "none",
              background: "#ffffff",
            }}
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: "18px",
                padding: "16px 24px",
              },
              body: {
                padding: "24px",
              },
            }}
          >
            <Space direction="vertical">
              <Text style={{ color: "#64748b", fontSize: "15px" }}>
                From:{" "}
                {currentRange
                  ? formatDate(currentRange[0].toDate())
                  : "Not Selected"}
              </Text>
              <Text style={{ color: "#64748b", fontSize: "15px" }}>
                To:{" "}
                {currentRange
                  ? formatDate(currentRange[1].toDate())
                  : "Not Selected"}
              </Text>
            </Space>
          </Card>

          <Card
            title="Comparison Range"
            style={{
              borderRadius: "16px",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
              border: "none",
              background: "#ffffff",
            }}
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: "18px",
                padding: "16px 24px",
              },
              body: {
                padding: "24px",
              },
            }}
          >
            <Space direction="vertical">
              <Text style={{ color: "#64748b", fontSize: "15px" }}>
                From:{" "}
                {comparisonRange
                  ? formatDate(comparisonRange[0])
                  : "Not Selected"}
              </Text>
              <Text style={{ color: "#64748b", fontSize: "15px" }}>
                To:{" "}
                {comparisonRange
                  ? formatDate(comparisonRange[1])
                  : "Not Selected"}
              </Text>
            </Space>
          </Card>
        </div>

        {/* Charts Section */}
        {selectedChartData.length > 0 && (
          <Card
            title="Selected Date Range Trend"
            style={{
              borderRadius: "16px",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
              border: "none",
              background: "#ffffff",
              marginBottom: "32px",
            }}
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: "18px",
                padding: "16px 24px",
              },
              body: {
                padding: "24px",
              },
            }}
          >
            <div style={{ padding: "16px" }}>
              <Bar {...selectedChartConfig} />
            </div>
          </Card>
        )}

        {comparisonChartData.length > 0 && (
          <Card
            title="Comparison Date Range Trend"
            style={{
              borderRadius: "16px",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
              border: "none",
              background: "#ffffff",
            }}
            styles={{
              header: {
                borderBottom: "1px solid #f1f5f9",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: "18px",
                padding: "16px 24px",
              },
              body: {
                padding: "24px",
              },
            }}
          >
            <div style={{ padding: "16px" }}>
              <Bar {...comparisonChartConfig} />
            </div>
          </Card>
        )}
      </div>
    </Suspense>
  );
}
