#!/usr/bin/env ruby
# frozen_string_literal: true

require 'roo'
require 'time'

XLSX_PATH = File.expand_path('../assets/CARISMA_publications.xlsx', __dir__)
OUTPUT_PATH = File.expand_path('../publications.md', __dir__)


def normalize_space(text)
  text.to_s.gsub(/\s+/, ' ').strip
end


def value_for(row, keys)
  keys.each do |key|
    value = normalize_space(row[key])
    return value unless value.empty?
  end
  ''
end


def first_author_surname(authors)
  normalize_space(authors).split(',', 2).first.to_s.strip.downcase
end


def extract_surname(full_name)
  name = normalize_space(full_name)
  return '' if name.empty?

  # Handle "Surname, Initials" format (e.g., "Dal Monte, T.", "Nobile, E.")
  if name.include?(',')
    surname = name.split(',').first.to_s.strip
    return surname unless surname.empty?
  end

  # Handle "Initials Surname" format (e.g., "M. Gaetani", "L.T. Massano")
  # Reject initials: single letters (M, E) or compound initials (L.T., M.L.V.)
  parts = name.split(/\s+/).reject { |p| p.match?(/\A([A-Z]\.)+\z/i) || p.match?(/\A[A-Z]\z/i) }
  parts.last.to_s.strip
end


def bold_surnames(citation, carisma_authors)
  text = citation.to_s.dup

  carisma_authors.each do |author|
    surname = extract_surname(author)
    next if surname.empty?

    # Skip if already bolded
    next if text.match?(/\*\*[^*]*#{Regexp.escape(surname)}[^*]*\*\*/i)

    # Match full author name patterns - order matters!
    patterns = [
      # "Surname, I." or "Surname, I.J." - initials with periods after comma
      /(?<![*\p{L}])(#{Regexp.escape(surname)},\s*[A-Z]\.(?:[A-Z]\.)*)(?=\s*[,:&]|\s+and\s|\s*$)/i,
      # "Surname I." or "Surname I.J." - initials with periods, space separated
      /(?<![*\p{L}])(#{Regexp.escape(surname)}\s+[A-Z]\.(?:[A-Z]\.)*)(?=\s*[,:]|\s+and\s|\s*$)/i,
      # "Surname I" or "Surname IJ" - initials WITHOUT periods (e.g., "Chericoni M")
      /(?<![*\p{L}])(#{Regexp.escape(surname)}\s+[A-Z](?:\.[A-Z])*)(?=\s*[,:]|\s+and\s|\s*$)/i,
      # "I. Surname" or "I.J. Surname" - initials before surname
      /(?<![*\p{L}])((?:[A-Z]\.\s*)+#{Regexp.escape(surname)})(?![*\p{L}])/i,
      # Just surname as fallback
      /(?<![*\p{L}])(#{Regexp.escape(surname)})(?![*\p{L}])/i
    ]

    patterns.each do |pattern|
      if text.match?(pattern)
        text = text.sub(pattern) { |m| "**#{m}**" }
        break
      end
    end
  end

  normalize_space(text)
end


def ensure_trailing_period(text)
  value = normalize_space(text)
  return '' if value.empty?
  return value if value.end_with?('.', '!', '?')

  "#{value}."
end


def build_citation(authors:, title:, journal:, year:, doi:)
  citation = +''
  doi_text = normalize_space(doi)
  doi_value = doi_text.sub(%r{\Ahttps?://(dx\.)?doi\.org/}i, '')
  doi_part = doi_text.empty? ? '' : "[#{doi_text}](https://doi.org/#{doi_value})"

  unless authors.empty?
    citation << authors
    citation << ': ' unless title.empty?
  end

  citation << title unless title.empty?
  citation << ", #{journal}" unless journal.empty?
  citation << ", #{doi_part}" unless doi_part.empty?
  citation << ", #{year}" unless year.empty?

  ensure_trailing_period(citation)
end

rows = []

xlsx = Roo::Spreadsheet.open(XLSX_PATH)
sheet = xlsx.sheet(0)
headers = sheet.row(1).map { |h| h.to_s.strip.downcase }

(2..sheet.last_row).each do |i|
  row_data = sheet.row(i)
  row = headers.each_with_index.to_h { |header, idx| [header, row_data[idx]] }

  # Collect all CARISMA authors from the relevant columns
  carisma_authors = [
    value_for(row, ['carisma 1st author']),
    value_for(row, ['carisma other authors (1)']),
    value_for(row, ['carisma other authors (2)']),
    value_for(row, ['carisma other authors (3)'])
  ].reject(&:empty?)

  authors = value_for(row, ['authors'])
  title = value_for(row, ['title'])
  journal = value_for(row, ['journal'])
  year = value_for(row, ['year'])
  doi = value_for(row, ['doi'])

  # Filter to only 2024-2025 publications
  year_int = year.to_s.to_i
  next unless year_int >= 2024 && year_int <= 2025

  citation = build_citation(
    authors: authors,
    title: title,
    journal: journal,
    year: year,
    doi: doi
  )
  next if citation.empty?

  rows << {
    citation: bold_surnames(citation, carisma_authors),
    first_author: first_author_surname(authors)
  }
end

rows.sort_by! { |r| r[:first_author] }


def markdown_to_html(text)
  text.gsub(/\*\*(.+?)\*\*/, '<strong>\1</strong>')
      .gsub(/\[([^\]]+)\]\(([^)]+)\)/, '<a href="\2">\1</a>')
end


output = +"---\n"
output << "layout: page\n"
output << "title: Publications\n"
output << "permalink: /publications/\n"
output << "---\n\n"
output << "<div class=\"prose-block page-section\">\n"
output << "  <h2>Publications</h2>\n"
output << "  <p>List of peer-reviewed scientific articles published in 2024-2025.</p>\n\n"

if rows.empty?
  output << "  <p>No publications found.</p>\n"
else
  output << "  <ul class=\"plain-list\">\n"
  rows.each do |entry|
    output << "    <li>#{markdown_to_html(entry[:citation])}</li>\n"
  end
  output << "  </ul>\n"
end

output << "</div>\n"

File.write(OUTPUT_PATH, output)
puts "Wrote #{OUTPUT_PATH} (#{rows.length} entries)"
