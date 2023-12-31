// Load the CSV data
let filename = "./datafiles/Merged_Unemployment_Level_and_Rate.csv";   
d3.csv(filename).then(data => {
    data.forEach(d => {
        // Split the year and month, then create a Date object
        const [year, month] = d.yearAndMonth.split('-').map(num => parseInt(num, 10));
        d.parsedDate = new Date(year, month - 1, 1); // JavaScript months are 0-indexed
        // Convert the Unemployment Rate to a number
        d["Unemployment Rate (in percentage)"] = +d["Unemployment Rate (in percentage)"];
    });
    initialize(data); // Call the initialize function with the processed data
});

// Define a dateFormatter function
const dateFormatter = d3.timeFormat("%Y-%m");

// Initialize the chart with data
function initialize(data) {
    // Set up chart dimensions and scales
    const width = 1000;
    const rowHeight = 30;
    const visibleRows = 20;
    const margin = { top: 20, right: 20, bottom: 50, left: 150 };
    const barPadding = 5;
    const duration = 100;

    // Define the x-scale
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Unemployment Rate (in percentage)"])])
        .range([margin.left, width - margin.right]);

    // Define the y-scale
    const y = d3.scaleBand()
        .range([margin.top, margin.top + rowHeight * visibleRows])
        .padding(0.1);

    // Create the SVG container
    const svg = d3.select("#scrollingChart")
        .append("svg")
        .attr("width", width)
        .attr("height", rowHeight * visibleRows + margin.top + margin.bottom)
        .attr("viewBox", [0, 0, width, rowHeight * visibleRows + margin.top + margin.bottom])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // Set the domain of the y-scale to the first set of data
    y.domain(data.slice(0, visibleRows).map(d => d.parsedDate));

    // Append bars to the SVG
    const bars = svg.selectAll("rect")
        .data(data.slice(0, visibleRows))
        .enter()
        .append("rect")
        .attr("x", margin.left)
        .attr("y", d => y(d.parsedDate))
        .attr("width", d => x(d["Unemployment Rate (in percentage)"]) - margin.left)
        .attr("height", y.bandwidth() - barPadding)
        .attr("fill", "steelblue");

    // Append labels to the bars
    const labels = svg.selectAll(".label")
        .data(data.slice(0, visibleRows))
        .enter()
        .append("text")
        .attr("class", "label")
        .text(d => dateFormatter(d.parsedDate))
        .attr("x", margin.left - 5)
        .attr("y", d => y(d.parsedDate) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-weight", "bold");

    // Append the x-axis to the SVG
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${rowHeight * visibleRows + margin.top})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-weight", "bold")
        .text("Unemployment Rate (in percentage)");

    // Append the y-axis label to the SVG
    const yAxisLabel = svg.append("text")
        .attr("x", -(rowHeight * visibleRows + margin.top) / 2)
        .attr("y", margin.left - 10)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-weight", "bold")
    
    // Append labels for the unemployment rates
    const rateLabels = svg.selectAll(".rateLabel")
        .data(data.slice(0, visibleRows), d => d.parsedDate)
        .enter()
        .append("text")
        .attr("class", "rateLabel")
        .attr("x", d => x(d["Unemployment Rate (in percentage)"]) + 5)
        .attr("y", d => y(d.parsedDate) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(d => d["Unemployment Rate (in percentage)"]+ '%');

    // Initialize scrubber elements
    const scrubberContainer = d3.select("#scrubber");
    const scrubber = scrubberContainer.append("input")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", data.length - visibleRows)
        .attr("value", 0)
        .on("input", function() {
            // When the slider value changes, call the updateChart function with the new value
            const index = +this.value;
            updateChart(index);
        });

    // Function to update the chart based on the scrubber position
    function updateChart(index) {
        // Get the new data slice for the current index
        const newData = data.slice(index, index + visibleRows);

        // Update the domain of the y-scale with new data
        y.domain(newData.map(d => d.parsedDate));

        // Update the bars
        bars.data(newData)
            .transition()
            .duration(duration)
            .attr("y", d => y(d.parsedDate))
            .attr("width", d => x(d["Unemployment Rate (in percentage)"]) - margin.left);

        // Update the labels
        labels.data(newData)
            .transition()
            .duration(duration)
            .attr("y", d => y(d.parsedDate) + y.bandwidth() / 2)
            .text(d => dateFormatter(d.parsedDate));

        

        // Bind the new data with the key function
            const rateLabelsUpdate = svg.selectAll(".rateLabel")
                .data(newData, d => d.parsedDate);

            rateLabels.data(data.slice(index, index + visibleRows), d => d.parsedDate)
                .transition()
                .duration(duration)
                .attr("x", d => x(d["Unemployment Rate (in percentage)"]) + 5)
                .attr("y", d => y(d.parsedDate) + y.bandwidth() / 2)
                .text(d => d["Unemployment Rate (in percentage)"] + '%');    

            // Enter selection: Append new labels
            const rateLabelsEnter = rateLabelsUpdate.enter()
                .append("text")
                .attr("class", "rateLabel")
                // Set attributes for entering elements here
                .attr("x", d => x(d["Unemployment Rate (in percentage)"]) + 5)
                .attr("y", d => y(d.parsedDate) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "start");

            // Update selection: Update attributes for existing elements
            rateLabelsUpdate
                .merge(rateLabelsEnter) // Combine enter and update selections
                .transition()
                .duration(duration)
                .attr("x", d => x(d["Unemployment Rate (in percentage)"]) + 5)
                .attr("y", d => y(d.parsedDate) + y.bandwidth() / 2)
                .text(d => d["Unemployment Rate (in percentage)"] + '%');

            // Exit selection: Remove elements that no longer have data
            rateLabelsUpdate.exit().remove();    
        

        
    }

    // Now that the scrubber and update functions are set up, we can continue with the rest of the chart.
    // If you want to still have the auto-scrolling functionality, you can keep the function below and
    // adjust it to work with the scrubber.

    // Function to automatically scroll through the data
    // Define a variable to keep track of the autoscroll state
        let isAutoscrolling = false;

        // Define the play/pause button and its event listener
        const playPauseButton = d3.select("#playPause")
            .append("button")
            .text("Play")
            .on("click", function() {
                isAutoscrolling = !isAutoscrolling;
                d3.select(this).text(isAutoscrolling ? "Pause" : "Play"); // Toggle button text
                if (isAutoscrolling) {
                    autoScroll();
                }
            });
        // Modify the scrubber's event listener to update the current index and pause autoscrolling when manually adjusted
        scrubber.on("input", function() {
            // Update the current index to the new value of the scrubber
            currentIndex = +this.value;

            // Update the chart to the new index
            updateChart(currentIndex);

            // Stop autoscrolling when the user manually adjusts the scrubber
            isAutoscrolling = false;
            playPauseButton.text("Play"); // Update the button text
        });

        // Update the playPauseButton's event listener to resume from currentIndex
        playPauseButton.on("click", function() {
            // Toggle the autoscrolling state
            isAutoscrolling = !isAutoscrolling;

            // Update the button text based on the autoscrolling state
            d3.select(this).text(isAutoscrolling ? "Pause" : "Play");

            // If resuming, start the auto-scroll from the current index
            if (isAutoscrolling) {
                autoScroll();
            }
        });
    let currentIndex = 0;
    
// Modify the autoScroll function

function autoScroll() {
    if (isAutoscrolling && currentIndex < data.length - visibleRows) {
        // Update the scrubber value
        scrubber.node().value = currentIndex;

        // Update the chart to the new index
        updateChart(currentIndex);

        // Increment the index
        currentIndex++;

        // If we've reached the end, you can choose to either stop or loop to the beginning
        if (currentIndex >= data.length - visibleRows) {
            currentIndex = 0; // Loop to start
            // isAutoscrolling = false; // Stop autoscrolling
        }

        // Schedule the next autoScroll if autoscrolling is active
        if (isAutoscrolling) {
            setTimeout(autoScroll, 1000); // Continue at the new index after the specified delay
        }
    }
}

}

// Handle the window resize event
window.addEventListener('resize', () => {
    // You can call a function here to resize the chart if necessary.
});
