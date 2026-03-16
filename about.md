---
layout: page
title: About us
permalink: /about/
---

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<div class="prose-block page-section">
  <h2>Our History</h2>
  <div class="two-column-grid">
    <div>
      <p><strong>{{ site.lab.full_name }} ({{ site.lab.name }})</strong> was founded in {{ site.lab.founded }} at {{ site.lab.university }} and is led by {{ site.lab.head }}.</p>
      <p>The origins of CARISMA lie in research activities developed at IUSS Pavia within the ROSE School, originally focused on earthquake risk assessment. Over time, the research scope progressively expanded to include flood risk with HYRIS (hydrogeological risks) curriculum and, more broadly, the impacts of climate change on natural hazards. The integration of these research lines between 2014 and 2018 led to the creation of a dedicated research group in 2019, initially named CLIMAX. As the group expanded, its activities evolved towards a unified framework aimed at understanding and managing extreme events and climate related risks. This process ultimately resulted in the establishment of CARISMA, which brings together expertise in engineering, physics, and economics to advance research on climate related risks and to support evidence based risk management strategies.</p> 
      <p>The group currently consists of 34 members.</p>
    </div>
    <div class="history-images">
      <figure class="history-image-card">
        <img src="{{ '/assets/img/carisma_2019.jpeg' | relative_url }}" alt="CARISMA team 2019">
        <figcaption>CARISMA team - 2019</figcaption>
      </figure>
      <figure class="history-image-card">
        <img src="{{ '/assets/img/carisma_2022.jpeg' | relative_url }}" alt="CARISMA team 2022">
        <figcaption>CARISMA team - 2022</figcaption>
      </figure>
    </div>
  </div>
  <figure class="history-image-featured history-image-card">
    <img src="{{ '/assets/img/carisma_2026.jpeg' | relative_url }}" alt="CARISMA team 2026">
    <figcaption>CARISMA team - 2026</figcaption>
  </figure>
</div>

<div class="prose-block page-section">
  <h2>Our Team Around the World</h2>
  <p>CARISMA brings together researchers from diverse backgrounds and nationalities, fostering a truly international research environment.</p>
  <div class="nationality-layout">
    <div class="nationality-map-wrap">
      <div id="nationality-map"></div>
    </div>
    <div class="nationality-summary-wrap">
      <div id="nationality-legend"></div>
    </div>
  </div>
</div>

<div class="prose-block page-section">
  <h2>Our Place</h2>
  <div class="two-column-grid place-layout">
    <div id="place-text" class="place-text">
      <p>CARISMA team is part of the University School for Advanced Studies IUSS Pavia, founded in 1997 in partnership with Pavia's historic merit colleges (Borromeo, Ghislieri, Nuovo, and Santa Caterina) and the Institute for the Right to Study (EDISU). Formally recognised as a university in 2005, IUSS belongs to the Federation of Italian Schools of Advanced Studies, institutions that share a common model of excellence-based, interdisciplinary advanced education.</p>
      <p>IUSS aims to contribute to the full enhancement of talented young people, taking care of their research training. In this spirit, IUSS coordinates the National PhD Programme in Sustainable Development and Climate Change (<a href="https://www.phd-sdc.it/">PhD SDC</a>), a three-year, fully English-taught doctoral programme co-funded by the Italian Ministry of University and Research. The programme trains the next generation of researchers to address climate change from multiple disciplinary angles, spanning Earth system science, socio-economic analysis, law, technology, and territorial governance. CARISMA serves as the scientific backbone of IUSS contribution to this programme.</p>
      <p>The main building of IUSS Pavia is the historic Palazzo del Broletto in Piazza Vittoria 15, a 12th-century complex and one of Pavia's most prominent medieval landmarks. You can find instead our group at Palazzo Marelli, located in Piazza Ercole Marelli, part of a contemporary urban redevelopment of the former Ercole Marelli industrial area near the city's historic centre and close to the train station, now a mixed-use district hosting residential houses, private companies, medical labs and shops.</p>
      <p>You can then find our offices in Piazza Ercole Marelli 15 (second floor), Pavia, Italy. Follow the instructions to find us:</p>
      <div class="direction-buttons">
        <a href="https://www.google.com/maps/dir//Istituto+Universitario+di+Studi+Superiori(IUSS+Pavia),+P.za+Ercole+Marelli,+27100+Pavia+PV/@45.1865094,9.1520175,17z/data=!4m9!4m8!1m0!1m5!1m1!1s0x4787276f65befecf:0x4e381ab1bbdf6ccb!2m2!1d9.149596!2d45.1914915!3e2?entry=ttu&g_ep=EgoyMDI2MDMwOS4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" class="direction-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>Open map directions</span>
        </a>
        <a href="{{ '/assets/pdf/how_to_find_us.pdf' | relative_url }}" target="_blank" rel="noreferrer" class="direction-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Open PDF directions</span>
        </a>
      </div>
    </div>
    <div id="place-images" class="place-images">
      <figure class="history-image-card">
        <img src="{{ '/assets/img/iuss_pavia_broletto.jpg' | relative_url }}" alt="IUSS Pavia - Palazzo Broletto">
        <figcaption>IUSS Pavia - Palazzo Broletto</figcaption>
      </figure>
      <figure class="history-image-card">
        <img src="{{ '/assets/img/iuss_pavia_marelli.jpg' | relative_url }}" alt="IUSS Pavia - Palazzo Marelli">
        <figcaption>IUSS Pavia - Palazzo Marelli</figcaption>
      </figure>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  function fitLegendToMapHeight() {
    const mapEl = document.getElementById('nationality-map');
    const legendEl = document.getElementById('nationality-legend');
    const statsEl = legendEl ? legendEl.querySelector('.nationality-stats') : null;
    if (!mapEl || !legendEl || !statsEl) return;

    if (window.matchMedia('(max-width: 768px)').matches) {
      legendEl.style.height = 'auto';
      statsEl.style.setProperty('--legend-scale', '1');
      statsEl.style.overflowY = 'visible';
      return;
    }

    legendEl.style.height = `${mapEl.clientHeight}px`;
    statsEl.style.setProperty('--legend-scale', '1');
    statsEl.style.overflowY = 'hidden';

    let scale = 1;
    const minScale = 0.68;
    while (statsEl.scrollHeight > statsEl.clientHeight && scale > minScale) {
      scale = Math.max(minScale, scale - 0.02);
      statsEl.style.setProperty('--legend-scale', scale.toFixed(2));
    }

    if (statsEl.scrollHeight > statsEl.clientHeight) {
      statsEl.style.overflowY = 'auto';
    }
  }

  function fitPlaceTextToImagesHeight() {
    const textEl = document.getElementById('place-text');
    const imagesEl = document.getElementById('place-images');
    if (!textEl || !imagesEl) return;

    if (window.matchMedia('(max-width: 768px)').matches) {
      textEl.style.height = 'auto';
      textEl.style.overflowY = 'visible';
      return;
    }

    textEl.style.height = `${imagesEl.clientHeight}px`;
    textEl.style.overflowY = textEl.scrollHeight > textEl.clientHeight ? 'auto' : 'hidden';
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fitLegendToMapHeight();
      fitPlaceTextToImagesHeight();
    }, 120);
  });

  // Country coordinates (approximate centers)
  const countryCoords = {
    'Italy': [42.5, 12.5],
    'Greece': [39.0, 22.0],
    'Mexico': [23.6, -102.5],
    'Egypt': [26.8, 30.8],
    'Algeria': [28.0, 3.0],
    'Brazil': [-14.2, -51.9],
    'Croatia': [45.1, 15.2],
    'India': [20.6, 79.0],
    'Pakistan': [30.4, 69.3],
    'Viet Nam': [14.1, 108.3],
    'Kenya': [-1.3, 36.8],
    'Nigeria': [9.1, 8.7],
    'Turkiye': [39.0, 35.2],
    'UK': [55.4, -3.4]
  };

  // Parse CSV and count nationalities
  fetch('{{ site.baseurl }}/assets/carisma_people.csv')
    .then(response => response.text())
    .then(data => {
      const lines = data.split('\n');
      const nationalities = {};

      // Skip header and empty rows
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        if (cols[0] && cols[0].trim() !== '' && cols[7]) {
          const country = cols[7].trim();
          if (country && country !== '') {
            nationalities[country] = (nationalities[country] || 0) + 1;
          }
        }
      }

      // Initialize map
      const map = L.map('nationality-map').setView([30, 10], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Add markers for each country
      let legendHtml = '<div class="nationality-stats"><h4>Team Members by Country</h4><ul>';
      const sortedCountries = Object.entries(nationalities).sort((a, b) => b[1] - a[1]);

      sortedCountries.forEach(([country, count]) => {
        if (countryCoords[country]) {
          const radius = Math.max(8, Math.min(25, count * 2 + 6));

          const marker = L.circleMarker(countryCoords[country], {
            radius: radius,
            fillColor: '#9DC545',
            color: '#7ea63a',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
          }).addTo(map);

          marker.bindPopup(`<strong>${country}</strong><br>${count} team member${count > 1 ? 's' : ''}`);
        }
        legendHtml += `<li><span class="country-name">${country}</span><span class="country-count">${count}</span></li>`;
      });

      const total = Object.values(nationalities).reduce((a, b) => a + b, 0);
      legendHtml += `</ul><p class="total-count"><strong>Total: ${total} members from ${Object.keys(nationalities).length} countries</strong></p></div>`;
      document.getElementById('nationality-legend').innerHTML = legendHtml;
      fitLegendToMapHeight();
      requestAnimationFrame(fitLegendToMapHeight);
      fitPlaceTextToImagesHeight();
      requestAnimationFrame(fitPlaceTextToImagesHeight);

      const placeImgs = document.querySelectorAll('#place-images img');
      placeImgs.forEach((img) => {
        img.addEventListener('load', fitPlaceTextToImagesHeight, { once: true });
      });
    });
});
</script>
