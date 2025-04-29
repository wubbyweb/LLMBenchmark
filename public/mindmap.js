// Mindmap visualization using D3.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the mindmap page
    if (document.getElementById('mindmap-container')) {
        // Create a new button for the mindmap view
        const mindmapBtn = document.createElement('button');
        mindmapBtn.className = 'btn btn-outline-primary ms-2';
        mindmapBtn.textContent = 'View Mindmap';
        mindmapBtn.id = 'mindmapBtn';
        
        // Add the button to the UI
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.parentNode.appendChild(mindmapBtn);
        
        // Add event listener for the mindmap button
        mindmapBtn.addEventListener('click', () => {
            window.location.href = '/mindmap';
        });
    }
    
    // If we're on the mindmap page, render the mindmap
    if (document.getElementById('mindmap-container')) {
        renderMindmap();
    }
});

function renderMindmap() {
    // Get the mindmap data from the server
    fetch('/api/mindmap')
        .then(response => response.json())
        .then(data => {
            // Create the SVG container
            const width = 1000;
            const height = 800;
            
            const svg = d3.select('#mindmap-container')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${width / 2},${height / 2})`);
            
            // Create a hierarchical structure from the data
            const root = d3.hierarchy(data);
            
            // Create a tree layout
            const treeLayout = d3.tree().size([2 * Math.PI, 200]);
            
            // Apply the layout to the data
            treeLayout(root);
            
            // Create links between nodes
            svg.selectAll('.link')
                .data(root.links())
                .enter()
                .append('path')
                .attr('class', 'link')
                .attr('d', d3.linkRadial()
                    .angle(d => d.x)
                    .radius(d => d.y))
                .style('fill', 'none')
                .style('stroke', '#ccc')
                .style('stroke-width', 1.5)
                .style('opacity', 0.7);
            
            // Create nodes
            const nodes = svg.selectAll('.node')
                .data(root.descendants())
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', d => `translate(${radialPoint(d.x, d.y)})`);
            
            // Add circles to nodes
            nodes.append('circle')
                .attr('r', d => 5 + d.depth * 2)
                .style('fill', d => {
                    const colors = ['#007bff', '#0069d9', '#0052b3', '#003d8f', '#00207a'];
                    return colors[Math.min(d.depth, colors.length - 1)];
                })
                .style('stroke', '#fff')
                .style('stroke-width', 1.5);
            
            // Add text labels to nodes
            nodes.append('text')
                .attr('dy', '.31em')
                .attr('x', d => d.x < Math.PI ? 10 : -10)
                .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
                .attr('transform', d => d.x < Math.PI ? null : 'rotate(180)')
                .text(d => d.data.name || d.data.text)
                .style('font-size', '12px')
                .style('fill', '#333');
            
            // Function to convert polar coordinates to Cartesian
            function radialPoint(x, r) {
                return [(r * Math.sin(x)), (r * -Math.cos(x))];
            }
        })
        .catch(error => {
            console.error('Error loading mindmap data:', error);
            document.getElementById('mindmap-container').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error!</h4>
                    <p>Failed to load mindmap data. Please try again.</p>
                </div>
            `;
        });
}