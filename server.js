const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const stringSimilarity = require("string-similarity");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const TERMINAL_FIELD = process.env.TERMINAL_FIELD || "TERMINAL_NAME";
const CARRIER_FIELD = process.env.CARRIER_FIELD || "CARRIER";

const STRICT_THRESHOLD = parseFloat(process.env.STRICT_THRESHOLD || "0.95");
const SUGGEST_THRESHOLD = parseFloat(process.env.SUGGEST_THRESHOLD || "0.85");

let terminals = [];
let carriers = [];

function loadCsv(filePath, columnName) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const value = data[columnName];
        if (value && value.trim()) {
          results.push(value.trim());
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

function validateAgainstList(inputValue, approvedList, label) {
  if (!approvedList || approvedList.length === 0) {
    return {
      Status: "Failed",
      Reason: `No approved ${label} list is loaded`
    };
  }

  if (!inputValue || !inputValue.trim()) {
    return {
      Status: "Failed",
      Reason: `${label} is blank`
    };
  }

  const cleanInput = inputValue.trim();
  const normalizedInput = normalize(cleanInput);

  const exactMatch = approvedList.find(
    (item) => normalize(item) === normalizedInput
  );

  if (exactMatch) {
    return {
      Status: "OK",
      Reason: "Everything is fine"
    };
  }

  const matches = stringSimilarity.findBestMatch(cleanInput, approvedList);
  const bestMatch = matches.bestMatch;

  if (bestMatch.rating >= STRICT_THRESHOLD) {
    return {
      Status: "OK",
      Reason: "Everything is fine"
    };
  }

  if (bestMatch.rating >= SUGGEST_THRESHOLD) {
    return {
      Status: "Failed",
      Reason: `Unknown ${label}. Did you mean \"${bestMatch.target}\"?`
    };
  }

  return {
    Status: "Failed",
    Reason: `Unknown ${label}`
  };
}

function getFieldValue(values, fieldName) {
  if (!Array.isArray(values)) return null;

  const match = values.find(
    (item) => item.FieldName && item.FieldName.toUpperCase() === fieldName.toUpperCase()
  );

  return match ? match.Item : null;
}

app.get("/", (req, res) => {
  res.send("Justmer PJ validation service is running.");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    terminalsLoaded: terminals.length,
    carriersLoaded: carriers.length
  });
});

app.post("/validate-terminal", (req, res) => {
  const values = req.body.Values || [];
  const terminalValue = getFieldValue(values, TERMINAL_FIELD);

  const result = validateAgainstList(terminalValue, terminals, "terminal name");
  res.json(result);
});

app.post("/validate-carrier", (req, res) => {
  const values = req.body.Values || [];
  const carrierValue = getFieldValue(values, CARRIER_FIELD);

  const result = validateAgainstList(carrierValue, carriers, "carrier name");
  res.json(result);
});

async function startServer() {
  try {
    terminals = await loadCsv("./terminals.csv", "terminal_name");
    carriers = await loadCsv("./carriers.csv", "carrier_name");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Loaded ${terminals.length} terminals`);
      console.log(`Loaded ${carriers.length} carriers`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
