---
layout: page
title: Contact Us
permalink: /contact/
---

<div class="contact-info">
  <div class="contact-item">
    <h3>Email</h3>
    <p><a href="mailto:{{ site.contact.email }}">{{ site.contact.email }}</a></p>
    <p><a href="mailto:{{ site.contact.secondary_email }}">{{ site.contact.secondary_email }}</a></p>
  </div>
  <div class="contact-item">
    <h3>Phone</h3>
    <p>{{ site.contact.phone }}</p>
    <p>{{ site.contact.fax }}</p>
  </div>
  <div class="contact-item">
    <h3>Address</h3>
    <address>
      {{ site.contact.address | newline_to_br }}
    </address>
    <p><a href="{{ site.contact.map_link }}" target="_blank" rel="noreferrer">Open map</a></p>
  </div>
</div>
