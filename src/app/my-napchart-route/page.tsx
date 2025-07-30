// src/app/my-napchart-route/page.tsx
'use client'; // This page component needs client-side features like rendering an <img> tag

import React from 'react';

/**
 * A Next.js page component that displays a Napchart snapshot as a static image
 * using the Napchart getImage API endpoint directly within the page file.
 */
const MyNapchartImagePage: React.FC = () => {
    // The chart ID you want to display - you can change this ID
    const chartId = "69LBSQzNQ";

    // Construct the image URL using the API endpoint and the chartId
    const imageUrl = `https://napchart.com/api/v2/getImage?chartid=${chartId}`;

    // Basic validation (optional, but good practice)
    if (!chartId) {
        // In a real app, you might render an error message or redirect
        console.error('MyNapchartImagePage: Chart ID is missing.');
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>
                <h1>Error</h1>
                <p>Chart ID is missing.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
            <h1>My Napchart</h1>
            <p>Displaying Napchart snapshot ID: {chartId} as a static image.</p>

            <div style={{ marginTop: '30px', maxWidth: '800px', margin: '30px auto' }}>
                {/* Use a standard <img> tag to display the image from the API URL */}
                <img
                    src={imageUrl}
                    alt={`Napchart for ID ${chartId}`} // Important for accessibility
                    style={{
                        display: 'block', // Helps with layout issues
                        maxWidth: '100%', // Ensure image is responsive within its container
                        height: 'auto',   // Maintain aspect ratio
                        width: '100%',    // Fill container width
                        border: '1px solid #ccc', // Example styling
                        borderRadius: '8px',
                    }}
                    // Optional: Add an onError handler if the image fails to load
                    onError={(e) => {
                        console.error(`Failed to load Napchart image for ID: ${chartId}`, e);
                        // You could change the image source to a fallback or display a message
                        // e.currentTarget.src = '/path/to/fallback-image.png'; // Example fallback image
                        // e.currentTarget.alt = 'Failed to load chart image'; // Update alt text on error
                    }}
                />
            </div>

            <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#555' }}>
                Image provided by napchart.com API.
            </p>
        </div>
    );
};

// This component is the default export for the page route
export default MyNapchartImagePage;
