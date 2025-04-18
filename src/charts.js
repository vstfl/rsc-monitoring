import Chart from "chart.js/auto";
import { map } from "./mapInteractions.js";

const data = {
  labels: ["Undefined", "Full", "Partly", "Bare"],
  datasets: [
    {
      label: " Deep Learning Prediction",
      data: [0.3, 0.5, 0.15, 0.05], // Undefined, Fully, Partly, Bare
      // backgroundColor: ["#FFAA00", "#FFFFFF", "#909090", "#000000"],
      backgroundColor: ["#554f56", "#E51000", "#EFC44E", "#80B932"],
      hoverOffset: 4,
    },
  ],
};

const config = {
  type: "doughnut",
  data: data,
  options: {
    elements: {
      point: {
        borderColor: "rgba(255, 255, 255, 0)",
        borderWidth: 8,
      },
    },
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 30,
          boxHeight: 20,
          boxWidth: 20,
          textAlign: "right",
          usePointStyle: true,
          font: {
            size: 14,
          },
          color: "white",
        },
        onClick: function (event, legendItem, legend) {
          // Default behaviour
          legend.chart.toggleDataVisibility(legendItem.index);
          legend.chart.update();

          // Mapbox data visibility handling
          const classification = legendItem.text; // Get the classification from legend item
          toggleMapVisibility(classification); // Toggle visibility in Mapbox
        },
      },
      maintainAspectRatio: false,
      responsive: true,
      animation: {
        animateRotate: true,
        animateScale: true,
      },
      layout: {
        padding: 20,
      },
      hoverOffset: 20,
    },
  },
};

let clickedLegendItems = ["Full", "Bare", "Partly", "Undefined"];

function toggleMapVisibility(classification) {
  const index = clickedLegendItems.indexOf(classification);
  if (index !== -1) {
    clickedLegendItems.splice(index, 1);
  } else {
    clickedLegendItems.push(classification);
  }
  console.log(clickedLegendItems);

  // Construct set filter logic here.
  map.setFilter(
    "latestLayer",
    ["in", "classification"].concat(clickedLegendItems),
  );
  map.setFilter(
    "latestInterpolationLayer",
    ["in", "classification"].concat(clickedLegendItems),
  );
}

// Create a function to update chart options based on container width
function updateChartOptions() {
  const containerWidth = document.getElementById("inner-console").clientWidth;
  if (containerWidth < 420) {
    config.options.plugins.legend.position = "top";
    config.options.plugins.legend.labels.padding = 15;
  } else {
    config.options.plugins.legend.position = "right";
    config.options.plugins.legend.labels.padding = 30;
    config.options.plugins.legend.padding = 5;
  }
}

function roundListToPrecision(list, precision) {
  return list.map(function (element) {
    return parseFloat(element.toFixed(precision));
  });
}

export function removeData(chart) {
  chart.data.datasets[0].data = [];
  chart.update();
  chart.canvas.parentNode.style.display = "none";
}

export function addData(chart, newData) {
  console.log("[addData] Received data:", newData, "Type:", typeof newData);
  let jsonObject;
  
  // Check if newData is already an object
  if (typeof newData === 'object' && newData !== null) {
    jsonObject = newData;
  } else if (typeof newData === 'string') {
    try {
      // Attempt to parse if it's a string
      jsonObject = JSON.parse(newData);
      console.log("[addData] Successfully parsed string data.");
    } catch (error) {
      console.error("[addData] Error parsing newData string:", error, "Data:", newData);
      // Handle error appropriately - maybe set default data or return
      chart.data.datasets[0].data = [0, 0, 0, 0]; // Example: Clear data on error
      chart.update();
      chart.canvas.parentNode.style.display = "none";
      return; // Exit the function if parsing fails
    }
  } else {
    console.error("[addData] Invalid data type received:", typeof newData, "Data:", newData);
    chart.data.datasets[0].data = [0, 0, 0, 0]; // Clear data
    chart.update();
    chart.canvas.parentNode.style.display = "none";
    return; // Exit if data is invalid
  }

  // Ensure jsonObject has the expected properties, providing defaults if necessary
  const listForm = [
    jsonObject.Undefined || 0,
    jsonObject.Full || 0,
    jsonObject.Partly || 0,
    jsonObject.Bare || 0,
  ];
  
  console.log("[addData] Processed data for chart:", listForm);
  const rounded = roundListToPrecision(listForm, 8);
  chart.data.datasets[0].data = rounded;
  chart.update();
  chart.canvas.parentNode.style.display = "flex";
}

let chart;

export function newChart() {
  chart = new Chart(document.getElementById("donutchart"), config);
  return chart;
}

let isMouseDown = false;
window.addEventListener("mousedown", (event) => {
  if (event.target.id === "console") {
    isMouseDown = true;
  }
});
window.addEventListener("mousemove", () => {
  if (isMouseDown) {
    updateChartOptions();
    chart.update();
  }
});
window.addEventListener("mouseup", () => {
  isMouseDown = false;
});

// Initial call to update chart options based on container width
updateChartOptions();
