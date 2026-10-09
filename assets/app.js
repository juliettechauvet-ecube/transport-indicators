/* Transport Indicators · E-CUBE Strategy Consultants */
(function () {
  "use strict";

  const COLORS = { BEV: "#13882D", PHEV: "#E7A74B", total: "#212121" };

  const I18N = {
    fr: {
      appName: "Transport Indicators",
      tabEv: "Véhicules électriques",
      asOf: "Données au",
      heroTitle1: "Transport",
      heroTitle2: "Indicators",
      lede: "Électrification du parc automobile : les indicateurs clés du transport bas-carbone en France. Calculs E-CUBE.",
      kpis: "Indicateurs",
      secEv: "Électrification des ventes",
      chartVolTitle: "Immatriculations de Voitures Électriques Neuves",
      chartVolSub: "[milliers de voitures particulières neuves (M1), par année, France]",
      chartShareTitle: "Part des Voitures Électriques dans les Ventes",
      chartShareSub: "[% des immatriculations de voitures particulières neuves (M1), par année, France]",
      ctlSeries: "Motorisation",
      ctlPeriod: "Période affichée",
      optBoth: "BEV + PHEV",
      opt10y: "10 ans",
      optSince2010: "Depuis 2010",
      optAll: "Tout",
      src: "Source : analyses E-CUBE Strategy Consultants sur la base des données EAFO (Commission européenne)",
      BEV: "Électrique à batterie (BEV)",
      PHEV: "Hybride rechargeable (PHEV)",
      total: "Total BEV + PHEV",
      ytd: "année en cours, cumul à date",
      noteVol: "BEV : voiture 100 % électrique à batterie ; PHEV : hybride rechargeable. Les hybrides non rechargeables (HEV) ne sont pas suivis par l'EAFO. L'année {y} est en cours : la barre hachurée est un cumul depuis le 1er janvier, non comparable à une année pleine.",
      noteShare: "Part calculée par l'EAFO sur le total des immatriculations de voitures particulières neuves, toutes motorisations confondues. L'année {y} est en cours : la part porte sur les immatriculations cumulées depuis le 1er janvier.",
      kpiShareBev: "Part des BEV dans les ventes, {y}",
      kpiShareAll: "Part des BEV + PHEV dans les ventes, {y}",
      kpiVolBev: "Immatriculations de BEV, {y}",
      kpiVolPhev: "Immatriculations de PHEV, {y}",
      vsPrev: "vs {p}",
      ofPrev: "du total {p} déjà atteint",
      pts: "pts",
      k: "k",
      foot: "Immatriculations et parts de marché : données EAFO (European Alternative Fuels Observatory), voitures particulières neuves (M1), France, {a} – {b}. Données vérifiées le {c} ; dernière modification constatée le {u}.",
      locale: "fr-FR",
    },
    en: {
      appName: "Transport Indicators",
      tabEv: "Electric vehicles",
      asOf: "Data as of",
      heroTitle1: "Transport",
      heroTitle2: "Indicators",
      lede: "Car fleet electrification: key indicators of low-carbon transport in France. E-CUBE calculations.",
      kpis: "Indicators",
      secEv: "Sales electrification",
      chartVolTitle: "New Electric Car Registrations",
      chartVolSub: "[thousand new passenger cars (M1), per year, France]",
      chartShareTitle: "Electric Car Share of Sales",
      chartShareSub: "[% of new passenger car (M1) registrations, per year, France]",
      ctlSeries: "Powertrain",
      ctlPeriod: "Period shown",
      optBoth: "BEV + PHEV",
      opt10y: "10 years",
      optSince2010: "Since 2010",
      optAll: "All",
      src: "Source: E-CUBE Strategy Consultants analysis based on EAFO data (European Commission)",
      BEV: "Battery electric (BEV)",
      PHEV: "Plug-in hybrid (PHEV)",
      total: "Total BEV + PHEV",
      ytd: "current year, year to date",
      noteVol: "BEV: battery electric car; PHEV: plug-in hybrid. Non-plug-in hybrids (HEV) are not tracked by EAFO. {y} is the current year: the hatched bar is a year-to-date total, not comparable with a full year.",
      noteShare: "Share computed by EAFO over all new passenger car registrations, all powertrains. {y} is the current year: the share covers registrations since 1 January.",
      kpiShareBev: "BEV share of sales, {y}",
      kpiShareAll: "BEV + PHEV share of sales, {y}",
      kpiVolBev: "BEV registrations, {y}",
      kpiVolPhev: "PHEV registrations, {y}",
      vsPrev: "vs {p}",
      ofPrev: "of the {p} total already reached",
      pts: "pts",
      k: "k",
      foot: "Registrations and market shares: EAFO data (European Alternative Fuels Observatory), new passenger cars (M1), France, {a} – {b}. Data checked on {c}; last change detected on {u}.",
      locale: "en-GB",
    },
  };

  const state = {
    lang: "fr",
    "vol-series": "both", "vol-period": "2010",
    "share-series": "both", "share-period": "2010",
  };
  let DATA = null;

  const t = (k, vars) => {
    let s = I18N[state.lang][k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split("{" + a + "}").join(b);
    return s;
  };
  const nf = (d) => new Intl.NumberFormat(t("locale"), { maximumFractionDigits: d, minimumFractionDigits: d });
  const fmtDate = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString(t("locale"), { day: "numeric", month: "short", year: "numeric" });

  try { const l = localStorage.getItem("ti-lang"); if (l === "fr" || l === "en") state.lang = l; } catch (e) { /* storage unavailable */ }

  /* ---------- data ---------- */
  const num = (v) => (v === "" || v == null ? null : +v);
  const parse = (rows) => rows.map((r) => ({ year: +r.YEAR, BEV: num(r.BEV), PHEV: num(r.PHEV) }));

  Promise.all([
    d3.csv("data/new_registrations_m1.csv"),
    d3.csv("data/market_share_new_registrations_m1.csv"),
    d3.json("data/meta.json").catch(() => ({})),
  ]).then(([vol, share, meta]) => {
    const v = parse(vol).filter((d) => d.BEV != null || d.PHEV != null);
    const s = parse(share).filter((d) => d.BEV != null || d.PHEV != null);
    const lastYear = d3.max(v, (d) => d.year);
    const refYear = meta.updated_at ? +meta.updated_at.slice(0, 4) : new Date().getFullYear();
    DATA = { vol: v, share: s, meta, lastYear, partial: lastYear >= refYear };
    render();
  }).catch((err) => {
    document.querySelector("main").insertAdjacentHTML("afterbegin", '<p class="note">Erreur de chargement des données / data loading error.</p>');
    console.error(err);
  });

  /* ---------- controls ---------- */
  document.querySelectorAll(".seg[data-ctl]").forEach((seg) => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state[seg.dataset.ctl] = b.dataset.v;
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      render();
    });
  });
  document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang;
    try { localStorage.setItem("ti-lang", state.lang); } catch (e) { /* storage unavailable */ }
    render();
  }));
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 120); });

  /* ---------- rendering ---------- */
  function render() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === state.lang));
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      if (k === "noteVol" || k === "noteShare") return;
      el.textContent = t(k);
    });
    if (!DATA) return;
    const y = DATA.lastYear;
    document.querySelector('[data-i18n="noteVol"]').textContent = DATA.partial ? t("noteVol", { y }) : t("noteVol", { y }).split(". ").slice(0, 2).join(". ") + ".";
    document.querySelector('[data-i18n="noteShare"]').textContent = DATA.partial ? t("noteShare", { y }) : t("noteShare", { y }).split(". ")[0] + ".";
    document.getElementById("asof").textContent = DATA.meta.updated_at ? fmtDate(DATA.meta.updated_at) : "–";
    document.getElementById("foot-data").textContent = t("foot", {
      a: d3.min(DATA.vol, (d) => d.year), b: y,
      c: DATA.meta.checked_at ? fmtDate(DATA.meta.checked_at) : "–",
      u: DATA.meta.updated_at ? fmtDate(DATA.meta.updated_at) : "–",
    });
    renderKpis();
    barChart();
    lineChart();
  }

  function yearLabel(y) { return DATA.partial && y === DATA.lastYear ? `${y}*` : `${y}`; }

  function renderKpis() {
    const { vol, share, lastYear: y } = DATA;
    const s1 = share.find((d) => d.year === y), s0 = share.find((d) => d.year === y - 1);
    const v1 = vol.find((d) => d.year === y), v0 = vol.find((d) => d.year === y - 1);
    const yl = DATA.partial ? `${y} (${t("ytd").split(", ")[1]})` : `${y}`;
    const delta = (a, b) => {
      const d = a - b, cls = d >= 0 ? "up" : "down", arrow = d >= 0 ? "▲" : "▼";
      return `<b class="${cls}">${arrow} ${d >= 0 ? "+" : ""}${nf(1).format(d)} ${t("pts")}</b> ${t("vsPrev", { p: y - 1 })}`;
    };
    const ratio = (a, b) => {
      if (DATA.partial) return `<b>${nf(0).format((a / b) * 100)} %</b> ${t("ofPrev", { p: y - 1 })}`;
      const g = (a / b - 1) * 100;
      return `<b class="${g >= 0 ? "up" : "down"}">${g >= 0 ? "▲ +" : "▼ "}${nf(0).format(g)} %</b> ${t("vsPrev", { p: y - 1 })}`;
    };
    const tiles = [
      { l: t("kpiShareBev", { y: yl }), v: nf(1).format(s1.BEV), u: "%", d: delta(s1.BEV, s0.BEV) },
      { l: t("kpiShareAll", { y: yl }), v: nf(1).format(s1.BEV + s1.PHEV), u: "%", d: delta(s1.BEV + s1.PHEV, s0.BEV + s0.PHEV) },
      { l: t("kpiVolBev", { y: yl }), v: nf(0).format(v1.BEV / 1000), u: t("k"), d: ratio(v1.BEV, v0.BEV) },
      { l: t("kpiVolPhev", { y: yl }), v: nf(0).format(v1.PHEV / 1000), u: t("k"), d: ratio(v1.PHEV, v0.PHEV) },
    ];
    document.getElementById("kpis").innerHTML = tiles.map((k) =>
      `<div class="kpi"><div class="kpi-l">${k.l}</div><div class="kpi-v">${k.v}<small>${k.u}</small></div><div class="kpi-d">${k.d}</div></div>`).join("");
  }

  function filterPeriod(rows, p) {
    const last = DATA.lastYear;
    if (p === "10") return rows.filter((d) => d.year > last - 10);
    if (p === "2010") return rows.filter((d) => d.year >= 2010);
    return rows;
  }
  const keysFor = (s) => (s === "both" ? ["BEV", "PHEV"] : [s]);

  function frame(el, h) {
    const W = el.clientWidth || 800;
    const m = { t: 22, r: W < 500 ? 10 : 20, b: 30, l: 44 };
    el.innerHTML = "";
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${h}`).attr("role", "img");
    return { svg, W, H: h, m, iw: W - m.l - m.r, ih: h - m.t - m.b };
  }

  function legend(id, items) {
    document.getElementById(id).innerHTML = items.map((i) =>
      `<span><i class="${i.cls || ""}" style="${i.color ? "background:" + i.color : ""}"></i>${i.label}</span>`).join("");
  }

  const tip = document.getElementById("tip");
  function showTip(ev, html) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  const tipRow = (c, l, v) => `<div class="r"><span><i style="background:${c}"></i>${l}</span><b>${v}</b></div>`;

  function barChart() {
    const el = document.getElementById("chart-volumes");
    const keys = keysFor(state["vol-series"]);
    const rows = filterPeriod(DATA.vol, state["vol-period"]);
    const { svg, W, m, iw, ih } = frame(el, Math.max(260, Math.min(420, el.clientWidth * 0.45)));
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    const x = d3.scaleBand().domain(rows.map((d) => d.year)).range([0, iw]).padding(0.22);
    const tot = (d) => d3.sum(keys, (k) => d[k] || 0) / 1000;
    const y = d3.scaleLinear().domain([0, d3.max(rows, tot) * 1.1]).nice().range([ih, 0]);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickSizeOuter(0).tickFormat((v) => nf(0).format(v)));
    const every = Math.ceil(rows.length / Math.max(4, Math.floor(iw / 46)));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickSizeOuter(0).tickValues(rows.map((d) => d.year).filter((v, i, a) => i % every === 0 || i === a.length - 1)).tickFormat(yearLabel));

    const defs = svg.append("defs");
    defs.append("pattern").attr("id", "hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
      .append("rect").attr("width", 2.5).attr("height", 6).attr("fill", "#FFFFFF").attr("opacity", 0.55);

    const stacked = d3.stack().keys(keys).value((d, k) => (d[k] || 0) / 1000)(rows);
    stacked.forEach((layer) => {
      g.append("g").selectAll("rect").data(layer).join("rect")
        .attr("x", (d) => x(d.data.year)).attr("width", x.bandwidth())
        .attr("y", (d) => y(d[1])).attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
        .attr("fill", COLORS[layer.key]);
      if (DATA.partial) {
        g.append("g").selectAll("rect").data(layer.filter((d) => d.data.year === DATA.lastYear)).join("rect")
          .attr("x", (d) => x(d.data.year)).attr("width", x.bandwidth())
          .attr("y", (d) => y(d[1])).attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
          .attr("fill", "url(#hatch)");
      }
    });

    if (x.bandwidth() >= 22) {
      g.append("g").selectAll("text").data(rows.filter((d) => tot(d) >= 1)).join("text")
        .attr("class", "val-label").attr("text-anchor", "middle")
        .attr("x", (d) => x(d.year) + x.bandwidth() / 2).attr("y", (d) => y(tot(d)) - 5)
        .text((d) => nf(0).format(tot(d)));
    }

    g.append("g").selectAll("rect").data(rows).join("rect")
      .attr("x", (d) => x(d.year) - (x.step() - x.bandwidth()) / 2).attr("width", x.step())
      .attr("y", 0).attr("height", ih).attr("fill", "transparent")
      .on("mousemove", (ev, d) => {
        let h = `<div class="t">${d.year}${DATA.partial && d.year === DATA.lastYear ? " (" + t("ytd") + ")" : ""}</div>`;
        keys.forEach((k) => { h += tipRow(COLORS[k], t(k), nf(0).format(d[k] || 0)); });
        if (keys.length > 1) h += tipRow(COLORS.total, t("total"), nf(0).format((d.BEV || 0) + (d.PHEV || 0)));
        showTip(ev, h);
      })
      .on("mouseleave", hideTip);

    const items = keys.map((k) => ({ color: COLORS[k], label: t(k) }));
    if (DATA.partial) items.push({ cls: "hatch", label: `${DATA.lastYear}* : ${t("ytd")}` });
    legend("leg-volumes", items);
    svg.attr("aria-label", t("chartVolTitle"));
    void W;
  }

  function lineChart() {
    const el = document.getElementById("chart-share");
    const series = state["share-series"];
    const rows = filterPeriod(DATA.share, state["share-period"]);
    const keys = series === "both" ? ["BEV", "PHEV", "total"] : [series];
    const val = (d, k) => (k === "total" ? (d.BEV || 0) + (d.PHEV || 0) : d[k]);
    const { svg, m, iw, ih } = frame(el, Math.max(260, Math.min(420, el.clientWidth * 0.45)));
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    const x = d3.scalePoint().domain(rows.map((d) => d.year)).range([0, iw]).padding(0.4);
    const ymax = d3.max(rows, (d) => d3.max(keys, (k) => val(d, k) || 0));
    const y = d3.scaleLinear().domain([0, ymax * 1.12]).nice().range([ih, 0]);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickSizeOuter(0).tickFormat((v) => nf(0).format(v) + " %"));
    const every = Math.ceil(rows.length / Math.max(4, Math.floor(iw / 46)));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickSizeOuter(0).tickValues(rows.map((d) => d.year).filter((v, i, a) => i % every === 0 || i === a.length - 1)).tickFormat(yearLabel));

    const lastFull = DATA.partial ? DATA.lastYear - 1 : DATA.lastYear;
    keys.forEach((k) => {
      const pts = rows.filter((d) => val(d, k) != null);
      const line = d3.line().x((d) => x(d.year)).y((d) => y(val(d, k)));
      const solid = pts.filter((d) => d.year <= lastFull);
      const tail = pts.filter((d) => d.year >= lastFull);
      const dash = k === "total" ? "6 4" : null;
      g.append("path").datum(solid).attr("fill", "none").attr("stroke", COLORS[k]).attr("stroke-width", 2.5).attr("stroke-dasharray", dash).attr("d", line);
      if (DATA.partial && tail.length === 2) {
        g.append("path").datum(tail).attr("fill", "none").attr("stroke", COLORS[k]).attr("stroke-width", 2).attr("stroke-dasharray", "2 4").attr("d", line);
      }
      g.append("g").selectAll("circle").data(pts).join("circle")
        .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(val(d, k))).attr("r", 3.2)
        .attr("fill", (d) => (DATA.partial && d.year === DATA.lastYear ? "#FFFFFF" : COLORS[k]))
        .attr("stroke", COLORS[k]).attr("stroke-width", 1.5);
      const last = pts[pts.length - 1];
      if (last) {
        g.append("text").attr("class", "val-label").attr("x", x(last.year) + 7).attr("y", y(val(last, k)) + 4)
          .attr("fill", COLORS[k]).style("fill", COLORS[k] === "#E7A74B" ? "#B47C24" : COLORS[k])
          .text(nf(1).format(val(last, k)) + " %");
      }
    });

    g.append("g").selectAll("rect").data(rows).join("rect")
      .attr("x", (d) => x(d.year) - x.step() / 2).attr("width", x.step())
      .attr("y", 0).attr("height", ih).attr("fill", "transparent")
      .on("mousemove", (ev, d) => {
        let h = `<div class="t">${d.year}${DATA.partial && d.year === DATA.lastYear ? " (" + t("ytd") + ")" : ""}</div>`;
        keys.forEach((k) => { h += tipRow(COLORS[k], t(k), val(d, k) == null ? "–" : nf(2).format(val(d, k)) + " %"); });
        showTip(ev, h);
      })
      .on("mouseleave", hideTip);

    const items = keys.map((k) => ({ color: COLORS[k], cls: "line", label: t(k) }));
    if (DATA.partial) items.push({ color: "#909090", cls: "line", label: `${DATA.lastYear}* : ${t("ytd")}` });
    legend("leg-share", items);
    svg.attr("aria-label", t("chartShareTitle"));
  }
})();
