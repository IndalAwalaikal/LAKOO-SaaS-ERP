/**
 * Simple CSV utility for Lakoo SaaS ERP
 */

export const jsonToCsv = (data: any[], fileName: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => {
    return Object.values(obj).map(val => {
      // Escape commas and wrap in quotes if string
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const csvToJson = (csv: string): any[] => {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple regex to handle quoted commas
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const obj: any = {};
    
    headers.forEach((header, index) => {
      let val = values[index] || '';
      // Remove quotes
      val = val.replace(/^"|"$/g, '').replace(/""/g, '"');
      
      // Basic type conversion
      if (!isNaN(Number(val)) && val !== '') {
        obj[header] = Number(val);
      } else {
        obj[header] = val;
      }
    });
    products.push(obj);
  }

  return products;
};
