const fs = require("fs");
const path = require("path");
const dir = "D:\\VNG project";

const store = {};
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.localStorage = localStorage;

const code = fs.readFileSync(path.join(dir, "admin/js/lead-saver.js"), "utf8");
eval(code + "\n;globalThis.addLead = typeof addLead !== \"undefined\" ? addLead : undefined;");

if (typeof globalThis.addLead !== "function") {
  console.log("FAIL: addLead not defined");
  process.exit(1);
}

globalThis.addLead({
  name: "Ravi Kumar",
  phone: "9876543210",
  plotSize: "150 Sq. Yards",
  budget: "20-30 Lakh",
  message: "Interested in corner plot",
  source: "Future Highway @ Alair"
});

const Leads = JSON.parse(localStorage.getItem("vng_leads") || "[]");
console.log("leads count:", Leads.length);
console.log("first lead:", JSON.stringify(Leads[0]));

const now = new Date();
const weekAgo = new Date(now - 7 * 86400000);
const monthAgo = new Date(now - 30 * 86400000);
const leadsWeek = Leads.filter(l => new Date(l.time) >= weekAgo).length;
const leadsMonth = Leads.filter(l => new Date(l.time) >= monthAgo).length;
const hotLeads = Leads.filter(l => l.tag === "hot").length;
console.log("month:", leadsMonth, "week:", leadsWeek, "hot:", hotLeads);

if (Leads.length === 1 && leadsMonth === 1 && leadsWeek === 1) {
  console.log("PASS: lead flows correctly");
} else {
  console.log("FAIL");
  process.exit(1);
}