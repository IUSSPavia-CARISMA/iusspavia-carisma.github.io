---
layout: page
title: Contact
permalink: /contact/
---

<div class="prose-block page-section">
  <h2>Get in Touch</h2>
  <p class="contact-intro">We welcome inquiries from prospective collaborators, students, and partners. Please reach out through any of the channels below.</p>

  <div class="contact-grid">
    <div class="contact-card">
      <div class="contact-card-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      </div>
      <h3 class="contact-card-title">Email</h3>
      <div class="contact-card-content">
        <a href="mailto:{{ site.contact.email }}">{{ site.contact.email }}</a>
        <a href="mailto:{{ site.contact.secondary_email }}">{{ site.contact.secondary_email }}</a>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-card-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <h3 class="contact-card-title">Telephone</h3>
      <div class="contact-card-content">
        <span>{{ site.contact.phone }}</span>
      </div>
    </div>

    <div class="contact-card">
      <div class="contact-card-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <h3 class="contact-card-title">Location</h3>
      <div class="contact-card-content">
        <address>{{ site.contact.address | newline_to_br }}</address>
      </div>
    </div>
  </div>
</div>
