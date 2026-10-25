(function () {
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;

  function ascii(value) {
    const out = new Uint8Array(value.length);
    for (let index = 0; index < value.length; index += 1) out[index] = value.charCodeAt(index) & 255;
    return out;
  }

  function pdfEscape(value) {
    const win = {
      á: "\\341", é: "\\351", í: "\\355", ó: "\\363", ú: "\\372",
      Á: "\\301", É: "\\311", Í: "\\315", Ó: "\\323", Ú: "\\332",
      ñ: "\\361", Ñ: "\\321", ü: "\\374", Ü: "\\334",
      "¿": "\\277", "¡": "\\241", "°": "\\260", "·": "\\267",
    };
    let out = "";
    for (const ch of String(value ?? "").replace(/\u00a0/g, " ")) {
      if (ch === "\\" || ch === "(" || ch === ")") out += `\\${ch}`;
      else if (win[ch]) out += win[ch];
      else if (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126) out += ch;
    }
    return out;
  }

  function num(value) {
    return (Math.round(value * 100) / 100).toFixed(2);
  }

  function rgb(hex) {
    const color = hex.replace("#", "");
    const value = color.length === 3 ? color.split("").map((item) => item + item).join("") : color;
    return [
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255,
    ].map((item) => item.toFixed(3)).join(" ");
  }

  function textWidth(value, size) {
    return [...String(value ?? "")].reduce((sum, ch) => sum + (ch === " " ? 0.33 : 0.5), 0) * size;
  }

  function wrap(value, size, width) {
    const words = String(value ?? "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next, size) > width) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function createPdf() {
    const pages = [];
    const images = [];
    let current = null;

    function addPage() {
      current = { commands: [], used: new Set() };
      pages.push(current);
      return api;
    }

    function imageName(jpeg) {
      let found = images.find((item) => item.bytes === jpeg.bytes);
      if (!found) {
        found = { bytes: jpeg.bytes, width: jpeg.width, height: jpeg.height, name: `Im${images.length + 1}` };
        images.push(found);
      }
      current.used.add(found.name);
      return found.name;
    }

    const api = {
      addPage,
      rect(x, y, w, h, color) {
        current.commands.push(`${rgb(color)} rg ${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`);
      },
      line(x1, y1, x2, y2, color, width) {
        current.commands.push(`${rgb(color)} RG ${num(width || 0.6)} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`);
      },
      image(jpeg, x, y, w, h) {
        if (!jpeg) return;
        const name = imageName(jpeg);
        current.commands.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(y)} cm /${name} Do Q`);
      },
      text(x, y, size, value, options) {
        const bold = options && options.bold;
        const color = (options && options.color) || "#161616";
        const align = options && options.align;
        let left = x;
        if (align === "right") left = x - textWidth(value, size);
        if (align === "center") left = x - textWidth(value, size) / 2;
        current.commands.push(`BT ${rgb(color)} rg /${bold ? "F2" : "F1"} ${num(size)} Tf 1 0 0 1 ${num(left)} ${num(y)} Tm (${pdfEscape(value)}) Tj ET`);
      },
      toBlob() {
        const chunks = [];
        let length = 0;
        const push = (part) => {
          const bytes = typeof part === "string" ? ascii(part) : part;
          chunks.push(bytes);
          const at = length;
          length += bytes.length;
          return at;
        };
        const offsets = [0];
        push("%PDF-1.4\n");
        const objects = [];
        const addObject = (body) => {
          objects.push(body);
          return objects.length;
        };
        const font1 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        const font2 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
        const imageIds = images.map((image) => addObject(image));
        const pageIds = pages.map(() => addObject(null));
        const contentIds = pages.map((page) => addObject(page));
        const pagesId = addObject(null);
        const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
        objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
        pages.forEach((page, index) => {
          const used = images.filter((image) => page.used.has(image.name));
          const xobject = used.length
            ? ` /XObject << ${used.map((image) => `/${image.name} ${imageIds[images.indexOf(image)]} 0 R`).join(" ")} >>`
            : "";
          objects[pageIds[index] - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${num(PAGE_W)} ${num(PAGE_H)}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >>${xobject} >> /Contents ${contentIds[index]} 0 R >>`;
        });
        objects.forEach((body, index) => {
          offsets[index + 1] = length;
          if (body && body.bytes) {
            push(`${index + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${body.width} /Height ${body.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${body.bytes.length} >>\nstream\n`);
            push(body.bytes);
            push("\nendstream\nendobj\n");
            return;
          }
          if (body && body.commands) {
            const stream = ascii(`${body.commands.join("\n")}\n`);
            push(`${index + 1} 0 obj\n<< /Length ${stream.length} >>\nstream\n`);
            push(stream);
            push("endstream\nendobj\n");
            return;
          }
          push(`${index + 1} 0 obj\n${body}\nendobj\n`);
        });
        const xref = length;
        let table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        for (let index = 1; index <= objects.length; index += 1) {
          table += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
        }
        push(table);
        push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
        const out = new Uint8Array(length);
        let cursor = 0;
        chunks.forEach((chunk) => {
          out.set(chunk, cursor);
          cursor += chunk.length;
        });
        return new Blob([out], { type: "application/pdf" });
      },
    };
    return api;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("imagen"));
      image.src = src;
    });
  }

  async function loadJpeg(src, background) {
    const image = await loadImage(src);
    const maxSide = 900;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = background || "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
  }

  function fit(jpeg, maxW, maxH) {
    const ratio = Math.min(maxW / jpeg.width, maxH / jpeg.height);
    return { w: jpeg.width * ratio, h: jpeg.height * ratio };
  }

  function brandHeader(pdf, logo, title, detail) {
    pdf.rect(0, PAGE_H - 108, PAGE_W, 108, "#070708");
    pdf.rect(0, PAGE_H - 112, PAGE_W, 4, "#d7c4a3");
    if (logo) {
      const box = fit(logo, 210, 74);
      pdf.image(logo, 36, PAGE_H - 28 - box.h, box.w, box.h);
    }
    pdf.text(PAGE_W - 36, PAGE_H - 48, 18, title, { bold: true, color: "#f4f5f6", align: "right" });
    pdf.text(PAGE_W - 36, PAGE_H - 70, 11, detail, { color: "#c5c8cc", align: "right" });
  }

  function footer(pdf, phone, page, total) {
    pdf.line(36, 42, PAGE_W - 36, 42, "#d7c4a3", 1);
    pdf.text(36, 26, 9, "DELTÁCTICA  ·  Artículos tácticos y militares", { color: "#5c6168" });
    pdf.text(PAGE_W - 36, 26, 9, `WhatsApp ${phone}   ${page} / ${total}`, { color: "#5c6168", align: "right" });
  }

  async function buildReceipt(order, assets) {
    const pdf = createPdf();
    pdf.addPage();
    const customer = order.customer || {};
    const phone = assets.phone || "";
    brandHeader(pdf, assets.logo, "RECIBO", order.id);
    pdf.text(36, PAGE_H - 140, 11, new Date(order.date).toLocaleString("es-CO"), { color: "#5c6168" });
    pdf.text(PAGE_W - 36, PAGE_H - 140, 11, customer.metodo || "", { color: "#5c6168", align: "right" });

    pdf.text(36, PAGE_H - 172, 10, "CLIENTE", { bold: true, color: "#8d939a" });
    const clientLines = [
      customer.nombre || "",
      customer.institucion || "",
      customer.telefono ? `Contacto ${customer.telefono}` : "",
    ].filter(Boolean);
    clientLines.forEach((line, index) => {
      pdf.text(36, PAGE_H - 190 - index * 16, 12, line, { bold: index === 0, color: "#161616" });
    });

    pdf.text(320, PAGE_H - 172, 10, "ENVÍO", { bold: true, color: "#8d939a" });
    const ship = [
      customer.recibe || customer.nombre || "",
      customer.telefonoEnvio ? `Entrega ${customer.telefonoEnvio}` : "",
      customer.direccion || "",
      [customer.barrio, customer.ciudad].filter(Boolean).join(", "),
      customer.departamento || "",
      customer.indicaciones || "",
    ].filter(Boolean);
    ship.forEach((line, index) => {
      pdf.text(320, PAGE_H - 190 - index * 16, 12, line, { bold: index === 0, color: "#161616" });
    });

    let y = PAGE_H - 168 - Math.max(clientLines.length, ship.length, 1) * 16 - 36;
    pdf.rect(36, y - 8, PAGE_W - 72, 24, "#070708");
    pdf.text(44, y, 10, "REF.", { bold: true, color: "#f4f5f6" });
    pdf.text(110, y, 10, "ARTÍCULO", { bold: true, color: "#f4f5f6" });
    pdf.text(360, y, 10, "CANT.", { bold: true, color: "#f4f5f6" });
    pdf.text(430, y, 10, "PRECIO", { bold: true, color: "#f4f5f6" });
    pdf.text(PAGE_W - 44, y, 10, "TOTAL", { bold: true, color: "#f4f5f6", align: "right" });
    y -= 28;
    (order.lines || []).forEach((line, index) => {
      if (index % 2 === 0) pdf.rect(36, y - 8, PAGE_W - 72, 24, "#f4f5f6");
      pdf.text(44, y, 11, line.id, { bold: true });
      pdf.text(110, y, 11, line.name);
      pdf.text(372, y, 11, String(line.qty));
      pdf.text(430, y, 11, assets.money(line.price));
      pdf.text(PAGE_W - 44, y, 11, assets.money(line.price * line.qty), { align: "right" });
      y -= 26;
    });
    y -= 8;
    pdf.rect(360, y - 10, PAGE_W - 396, 32, "#070708");
    pdf.text(PAGE_W - 44, y + 2, 14, assets.money(order.total), { bold: true, color: "#f4f5f6", align: "right" });
    y -= 36;
    pdf.text(36, y, 11, `Pago: ${customer.metodo || ""}`, { color: "#161616" });
    if (customer.pago) pdf.text(36, y - 16, 11, customer.pago, { color: "#5c6168" });
    if (customer.nota) {
      wrap(customer.nota, 11, 320).slice(0, 3).forEach((line, index) => {
        pdf.text(36, y - 36 - index * 14, 11, line, { color: "#5c6168" });
      });
    }
    footer(pdf, phone, 1, 1);
    return pdf.toBlob();
  }

  window.DTPDF = {
    loadJpeg,
    async receipt(order, assets) {
      return buildReceipt(order, assets);
    },
    async catalog(items, assets) {
      const pdf = createPdf();
      const plan = ["cover"];
      pdf.addPage();
      pdf.rect(0, 0, PAGE_W, PAGE_H, "#070708");
      if (assets.logo) {
        const box = fit(assets.logo, 340, 160);
        pdf.image(assets.logo, (PAGE_W - box.w) / 2, PAGE_H - 280 - box.h, box.w, box.h);
      }
      pdf.rect(150, PAGE_H - 312, PAGE_W - 300, 2, "#d7c4a3");
      pdf.text(PAGE_W / 2, PAGE_H - 360, 28, "CATÁLOGO", { bold: true, color: "#f4f5f6", align: "center" });
      pdf.text(PAGE_W / 2, PAGE_H - 390, 13, assets.title || "Artículos tácticos y militares", { color: "#c5c8cc", align: "center" });
      pdf.text(PAGE_W / 2, PAGE_H - 434, 12, "Campo   ·   Faena   ·   Abrigo   ·   Calzado   ·   Equipo", { color: "#f4f5f6", align: "center" });
      pdf.text(PAGE_W / 2, 72, 11, `${items.length} referencias`, { color: "#c5c8cc", align: "center" });
      pdf.text(PAGE_W / 2, 52, 10, `WhatsApp ${assets.phone}`, { color: "#8d939a", align: "center" });

      for (let index = 0; index < items.length; index += 2) {
        plan.push("sheet");
        pdf.addPage();
        pdf.rect(0, PAGE_H - 72, PAGE_W, 72, "#070708");
        pdf.rect(0, PAGE_H - 76, PAGE_W, 4, "#d7c4a3");
        if (assets.wordmark) {
          const box = fit(assets.wordmark, 190, 30);
          pdf.image(assets.wordmark, 36, PAGE_H - 52, box.w, box.h);
        }
        pdf.text(PAGE_W - 36, PAGE_H - 44, 11, "CATÁLOGO", { color: "#c5c8cc", align: "right" });
        [items[index], items[index + 1]].filter(Boolean).forEach((item, slot) => {
          const top = PAGE_H - 110 - slot * 340;
          pdf.rect(36, top - 250, 220, 250, "#f3f4f5");
          if (item.photo) {
            const box = fit(item.photo, 200, 230);
            pdf.image(item.photo, 46 + (200 - box.w) / 2, top - 240 + (230 - box.h) / 2, box.w, box.h);
          }
          pdf.text(276, top - 24, 11, `${item.id}   ·   ${item.line}`, { bold: true, color: "#8d939a" });
          wrap(item.name, 20, 270).slice(0, 2).forEach((line, lineIndex) => {
            pdf.text(276, top - 54 - lineIndex * 24, 20, line, { bold: true, color: "#161616" });
          });
          wrap(item.note || "", 12, 270).slice(0, 4).forEach((line, lineIndex) => {
            pdf.text(276, top - 118 - lineIndex * 16, 12, line, { color: "#161616" });
          });
          pdf.text(276, top - 214, 16, assets.money(item.price), { bold: true, color: "#161616" });
        });
        const pageNumber = plan.length;
        pdf.line(36, 40, PAGE_W - 36, 40, "#d7c4a3", 1);
        pdf.text(36, 24, 9, "DELTÁCTICA  ·  Artículos tácticos y militares", { color: "#5c6168" });
        pdf.text(PAGE_W - 36, 24, 9, `${pageNumber}`, { color: "#5c6168", align: "right" });
      }
      return pdf.toBlob();
    },
  };
})();
