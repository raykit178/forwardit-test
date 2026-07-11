export type CompositeBrand = {
  businessName: string;
  logoDataUrl: string | null;
  brandColor: string;
  contactNumber: string;
  extraInfo: string | null;
  brandBarStyle: "style_1" | "style_2";
};

export function compositeBrandBar(
  aiImageUrl: string,
  brand: CompositeBrand,
  canvas?: HTMLCanvasElement | null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cv = canvas || document.createElement("canvas");
    cv.width = 1024;
    cv.height = 1024;
    const ctx = cv.getContext("2d");
    if (!ctx) return reject("No canvas context");

    const brandBarHeight = 256;
    const brandBarTop = 1024 - brandBarHeight;

    const getContentBounds = (img: HTMLImageElement) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      const octx = offscreen.getContext("2d")!;
      octx.drawImage(img, 0, 0);
      const { data, width, height } = octx.getImageData(0, 0, img.width, img.height);
      let minX = width, minY = height, maxX = 0, maxY = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 20) continue;
          if (r > 240 && g > 240 && b > 240) continue;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      if (maxX < minX) return { x: 0, y: 0, w: width, h: height };
      return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    };

    const aiImg = new Image();
    aiImg.crossOrigin = "anonymous";
    aiImg.onload = () => {
      ctx.drawImage(aiImg, 0, 0, 1024, 1024);

      const drawStamp = () => {
        try {
          ctx.font = `500 16px 'DM Sans'`;
          const sample = ctx.getImageData(10, 650, 14, 90).data;
          let total = 0;
          const pixels = sample.length / 4;
          for (let i = 0; i < sample.length; i += 4) {
            total += 0.299 * sample[i] + 0.587 * sample[i + 1] + 0.114 * sample[i + 2];
          }
          const avgLum = total / pixels;
          const isLight = avgLum > 150;
          const pillColor = isLight ? "rgba(0, 0, 0, 0.45)" : "rgba(255, 255, 255, 0.35)";
          const textColor = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.85)";
          const metrics = ctx.measureText("instabrand.in");
          const textWidth = metrics.width;
          const textHeight =
            (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0);
          const ascent = metrics.actualBoundingBoxAscent || 0;
          ctx.save();
          ctx.translate(14, 720);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = pillColor;
          ctx.beginPath();
          ctx.roundRect(-6, -(ascent + 6), textWidth + 12, textHeight + 12, 4);
          ctx.fill();
          ctx.fillStyle = textColor;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText("instabrand.in", 0, 0);
          ctx.restore();
        } catch {
          /* tainted canvas */
        }
      };

      const renderStyle2 = (logoImg: HTMLImageElement | null) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, brandBarTop, 1024, brandBarHeight);
        ctx.fillStyle = brand.brandColor || "#006AFF";
        ctx.fillRect(0, brandBarTop, 1024, 8);

        if (logoImg) {
          const bounds = getContentBounds(logoImg);
          const maxLogoHeight = 190;
          const maxLogoWidth = 320;
          const scale = Math.min(maxLogoHeight / bounds.h, maxLogoWidth / bounds.w);
          const logoW = bounds.w * scale;
          const logoH = bounds.h * scale;
          const logoX = 32;
          const logoY = brandBarTop + 4 + (brandBarHeight - 4) / 2 - logoH / 2;
          ctx.drawImage(logoImg, bounds.x, bounds.y, bounds.w, bounds.h, logoX, logoY, logoW, logoH);
        }

        const rightColLeft = Math.round(1024 * 0.55);
        const rightColPadL = 24;
        const rightColPadR = 24;
        const rightColInnerLeft = rightColLeft + rightColPadL;
        const rightColInnerRight = 1024 - rightColPadR;
        const rightColInnerWidth = rightColInnerRight - rightColInnerLeft;
        const extra = (brand.extraInfo ?? "").trim();

        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        const nameY = brandBarTop + 40;
        ctx.font = `900 38px 'Noto Sans', 'Noto Sans Devanagari', sans-serif`;
        ctx.fillStyle = "#222222";
        const nameText = (brand.businessName || "").toUpperCase();
        let displayName = nameText;
        if (ctx.measureText(displayName).width > rightColInnerWidth) {
          while (displayName.length > 1 && ctx.measureText(displayName + "…").width > rightColInnerWidth) {
            displayName = displayName.slice(0, -1);
          }
          displayName = displayName + "…";
        }
        ctx.fillText(displayName, rightColInnerLeft, nameY);

        if (extra) {
          ctx.font = `400 26px 'Noto Sans', 'Noto Sans Devanagari', sans-serif`;
          ctx.fillStyle = "#333333";
          const words = extra.split(/\s+/);
          const lines: string[] = [];
          let current = "";
          for (const w of words) {
            const test = current ? current + " " + w : w;
            if (ctx.measureText(test).width <= rightColInnerWidth || !current) {
              current = test;
            } else {
              lines.push(current);
              current = w;
              if (lines.length === 1) break;
            }
          }
          if (current && lines.length < 2) lines.push(current);
          if (lines.length === 2) {
            const consumed = lines.join(" ").split(/\s+/).length;
            const rest = words.slice(consumed).join(" ");
            if (rest) lines[1] = lines[1] + " " + rest;
          }
          const dividerY = brandBarTop + 150;
          const lineHeight = 34;
          const firstY = brandBarTop + 84;
          lines.forEach((ln, i) => {
            ctx.fillText(ln, rightColInnerLeft, firstY + i * lineHeight);
          });
          ctx.fillStyle = "#BBBBBB";
          ctx.fillRect(rightColInnerLeft, dividerY - 0.75, rightColInnerWidth, 1.5);
          ctx.font = `600 36px DM Sans, sans-serif`;
          ctx.fillStyle = "#222222";
          const phoneText = "✆  " + brand.contactNumber;
          const phoneY = brandBarTop + 182;
          ctx.fillText(phoneText, rightColInnerLeft, phoneY);
        } else {
          ctx.font = `600 36px DM Sans, sans-serif`;
          ctx.fillStyle = "#222222";
          const phoneText = "✆  " + brand.contactNumber;
          const rightMargin = 40;
          const textX = 1024 - rightMargin;
          const textY = brandBarTop + 182;
          ctx.textAlign = "right";
          ctx.fillText(phoneText, textX, textY);
        }
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        drawStamp();
        resolve(cv.toDataURL("image/png"));
      };

      const renderStyle1 = (logoImg: HTMLImageElement | null) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, brandBarTop, 1024, brandBarHeight);
        const accentColor = brand.brandColor || "#006AFF";
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, brandBarTop, 1024, 8);

        const containerW = 280;
        const containerH = 320;
        const containerX = 32;
        const containerY = 1024 - containerH;
        const radius = 20;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(containerX, containerY + containerH);
        ctx.lineTo(containerX, containerY + radius);
        ctx.quadraticCurveTo(containerX, containerY, containerX + radius, containerY);
        ctx.lineTo(containerX + containerW - radius, containerY);
        ctx.quadraticCurveTo(containerX + containerW, containerY, containerX + containerW, containerY + radius);
        ctx.lineTo(containerX + containerW, containerY + containerH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (logoImg) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(containerX, containerY + containerH);
          ctx.lineTo(containerX, containerY + radius);
          ctx.quadraticCurveTo(containerX, containerY, containerX + radius, containerY);
          ctx.lineTo(containerX + containerW - radius, containerY);
          ctx.quadraticCurveTo(containerX + containerW, containerY, containerX + containerW, containerY + radius);
          ctx.lineTo(containerX + containerW, containerY + containerH);
          ctx.closePath();
          ctx.clip();

          const iw = logoImg.width;
          const ih = logoImg.height;
          const scale = Math.max(containerW / iw, containerH / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = containerX + (containerW - dw) / 2;
          const dy = containerY + (containerH - dh) / 2;
          ctx.drawImage(logoImg, dx, dy, dw, dh);
          ctx.restore();
        }

        const rightColLeft = containerX + containerW + 24;
        const rightColRight = 1024 - 28;
        const rightColWidth = rightColRight - rightColLeft;

        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const nameY = brandBarTop + 26;
        ctx.font = `700 40px DM Sans, sans-serif`;
        ctx.fillStyle = "#111111";
        const nameText = (brand.businessName || "").toUpperCase();
        let displayName = nameText;
        if (ctx.measureText(displayName).width > rightColWidth) {
          while (displayName.length > 1 && ctx.measureText(displayName + "…").width > rightColWidth) {
            displayName = displayName.slice(0, -1);
          }
          displayName = displayName + "…";
        }
        ctx.fillText(displayName, rightColLeft, nameY);

        const extra = (brand.extraInfo ?? "").trim();
        const infoTop = nameY + 48;
        const infoLineHeight = 26;
        let infoBottom = infoTop;
        if (extra) {
          ctx.font = `400 22px 'Noto Sans', 'Noto Sans Devanagari', sans-serif`;
          ctx.fillStyle = "#444444";
          const words = extra.split(/\s+/);
          const lines: string[] = [];
          let current = "";
          for (const w of words) {
            const test = current ? current + " " + w : w;
            if (ctx.measureText(test).width <= rightColWidth || !current) {
              current = test;
            } else {
              lines.push(current);
              current = w;
              if (lines.length === 1) break;
            }
          }
          if (current && lines.length < 2) lines.push(current);
          if (lines.length === 2) {
            const consumed = lines.join(" ").split(/\s+/).length;
            const rest = words.slice(consumed).join(" ");
            if (rest) {
              let l2 = lines[1] + (rest ? " " + rest : "");
              if (ctx.measureText(l2).width > rightColWidth) {
                while (l2.length > 1 && ctx.measureText(l2 + "…").width > rightColWidth) {
                  l2 = l2.slice(0, -1);
                }
                l2 = l2 + "…";
              }
              lines[1] = l2;
            }
          }
          lines.forEach((ln, i) => {
            ctx.fillText(ln, rightColLeft, infoTop + i * infoLineHeight);
          });
          infoBottom = infoTop + lines.length * infoLineHeight;
        }

        const dividerY = infoBottom + 12;
        ctx.fillStyle = "#CCCCCC";
        ctx.fillRect(rightColLeft, dividerY, rightColWidth, 1.25);

        const phoneY = dividerY + 14;
        ctx.font = `700 32px DM Sans, sans-serif`;
        ctx.fillStyle = "#111111";
        ctx.fillText("✆  " + brand.contactNumber, rightColLeft, phoneY);

        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";

        drawStamp();
        resolve(cv.toDataURL("image/png"));
      };

      const render = brand.brandBarStyle === "style_1" ? renderStyle1 : renderStyle2;

      if (brand.logoDataUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => render(logoImg);
        logoImg.onerror = () => render(null);
        logoImg.src = brand.logoDataUrl;
      } else {
        render(null);
      }
    };
    aiImg.onerror = reject;
    aiImg.src = aiImageUrl;
  });
}
