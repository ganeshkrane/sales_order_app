import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

// Enable body parsing for json and raw text
app.use(express.json());
app.use(express.text({ type: '*/*' }));

// CORS & Security headers for iFrame & SAPUI5 CDN
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, MERGE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-csrf-token, MaxDataServiceVersion, DataServiceVersion');
  res.header('Access-Control-Expose-Headers', 'x-csrf-token, DataServiceVersion');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Cache mock data in-memory
const mockDataDir = path.join(__dirname, 'localService', 'mockdata');
const metadataPath = path.join(__dirname, 'localService', 'metadata.xml');

function loadJson(filename: string): any[] {
  try {
    const fullPath = path.join(mockDataDir, filename);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error loading ${filename}:`, e);
  }
  return [];
}

let customers = loadJson('Customers.json');
let salesOrders = loadJson('SalesOrders.json');
let products = loadJson('Products.json');
let orderItems = loadJson('OrderItems.json');
let partnerAddresses = loadJson('PartnerAddresses.json');
let productAttributes = loadJson('ProductAttributes.json');
let productImages = loadJson('ProductImages.json');
let addons = loadJson('Addonn.json');

// OData service base path
const ODATA_BASE = '/sap/opu/odata/sap/ZSRA017_SALESORDER_CREATE_SRV';

// Helper for OData response
function sendOData(res: Response, data: any, isSingle = false) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('DataServiceVersion', '2.0');
  if (isSingle) {
    res.json({ d: data });
  } else {
    res.json({
      d: {
        results: Array.isArray(data) ? data : [data],
        __count: Array.isArray(data) ? String(data.length) : '1'
      }
    });
  }
}

// Intercept all requests under ODATA_BASE
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqUrl = req.path;
  if (!reqUrl.startsWith(ODATA_BASE)) {
    return next();
  }

  res.setHeader('DataServiceVersion', '2.0');
  if (req.headers['x-csrf-token'] === 'Fetch') {
    res.setHeader('x-csrf-token', 'mock-csrf-token-' + Date.now());
  }

  // 1. $metadata
  if (reqUrl.endsWith('/$metadata') || reqUrl.endsWith('/%24metadata')) {
    if (fs.existsSync(metadataPath)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.send(fs.readFileSync(metadataPath, 'utf-8'));
    }
    return res.status(404).send('Metadata not found');
  }

  // 2. $batch multipart POST
  if (req.method === 'POST' && (reqUrl.endsWith('/$batch') || reqUrl.endsWith('/%24batch'))) {
    const boundaryMatch = (req.headers['content-type'] || '').match(/boundary=([^;]+)/i);
    const responseBoundary = 'batch_response_' + Date.now();
    const body = typeof req.body === 'string' ? req.body : '';

    const getMatches = body.match(/GET\s+([^\s\r\n]+)/gi) || [];
    let responseParts: string[] = [];

    for (const match of getMatches) {
      const targetUrl = match.replace(/^GET\s+/i, '').trim();
      let resultPayload = { d: { results: [] as any[] } };

      if (targetUrl.includes('Customers')) {
        resultPayload = { d: { results: customers } };
      } else if (targetUrl.includes('SalesOrders')) {
        resultPayload = { d: { results: salesOrders } };
      } else if (targetUrl.includes('Products')) {
        resultPayload = { d: { results: products } };
      } else if (targetUrl.includes('OrderItems')) {
        resultPayload = { d: { results: orderItems } };
      } else if (targetUrl.includes('PartnerAddresses')) {
        resultPayload = { d: { results: partnerAddresses } };
      }

      const jsonStr = JSON.stringify(resultPayload);
      const part = [
        `--${responseBoundary}`,
        'Content-Type: application/http',
        'Content-Transfer-Encoding: binary',
        '',
        'HTTP/1.1 200 OK',
        'Content-Type: application/json; charset=utf-8',
        `Content-Length: ${Buffer.byteLength(jsonStr, 'utf-8')}`,
        'dataserviceversion: 2.0',
        '',
        jsonStr
      ].join('\r\n');

      responseParts.push(part);
    }

    if (responseParts.length === 0) {
      responseParts.push(
        `--${responseBoundary}\r\nContent-Type: application/http\r\nContent-Transfer-Encoding: binary\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\n\r\n{"d":{"results":[]}}`
      );
    }

    const finalBody = responseParts.join('\r\n') + `\r\n--${responseBoundary}--\r\n`;
    res.setHeader('Content-Type', `multipart/mixed; boundary=${responseBoundary}`);
    return res.status(202).send(finalBody);
  }

  // 3. Customers
  if (reqUrl.includes('/Customers')) {
    const keyMatch = reqUrl.match(/Customers\(['"]?([^)'"]+)['"]?\)/);
    if (keyMatch) {
      const custId = keyMatch[1];
      const found = customers.find(c => c.CustomerID === custId) || customers[0];
      return sendOData(res, found, true);
    }
    return sendOData(res, customers);
  }

  // 4. SalesOrders
  if (reqUrl.includes('/SalesOrders')) {
    if (req.method === 'POST') {
      let orderData = req.body;
      if (typeof orderData === 'string') {
        try { orderData = JSON.parse(orderData); } catch { orderData = {}; }
      }
      const newId = '00000' + (10000 + salesOrders.length + 1);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

      const createdOrder = {
        ...orderData,
        SalesOrderNumber: newId,
        OrderDate: dateStr,
        RequestedDate: orderData.RequestedDate || dateStr,
        Status: 'A',
        GrandTotal: orderData.GrandTotal || '1500.000',
        TotalAmount: orderData.TotalAmount || '1300.000',
        Tax: '150.000',
        Freight: '50.000',
        Currency: orderData.Currency || 'USD'
      };

      salesOrders.unshift(createdOrder);
      res.status(201);
      return sendOData(res, createdOrder, true);
    }

    const keyMatch = reqUrl.match(/SalesOrders\(['"]?([^)'"]+)['"]?\)/);
    if (keyMatch) {
      const soNum = keyMatch[1];
      const found = salesOrders.find(s => s.SalesOrderNumber === soNum) || salesOrders[0];
      return sendOData(res, found, true);
    }

    const filter = (req.query.$filter as string) || '';
    if (filter) {
      const custMatch = filter.match(/CustomerID\s+eq\s+['"]?([^'"]+)['"]?/);
      if (custMatch) {
        const filtered = salesOrders.filter(s => s.CustomerID === custMatch[1]);
        return sendOData(res, filtered.length > 0 ? filtered : salesOrders);
      }
    }
    return sendOData(res, salesOrders);
  }

  // 5. Products
  if (reqUrl.includes('/Products')) {
    const isSingle = reqUrl.includes('/Products(');
    if (isSingle) {
      let prodId = '';
      const idMatch = reqUrl.match(/ProductID=['"]([^'"]+)['"]/i);
      if (idMatch) {
        prodId = idMatch[1];
      } else {
        const simpleMatch = reqUrl.match(/Products\(['"]?([^)'",]+)['"]?/i);
        if (simpleMatch) prodId = simpleMatch[1];
      }

      const found = (prodId ? products.find(p => p.ProductID === prodId) : null) || products[0];
      const attrs = productAttributes.filter(a => !prodId || a.ProductID === found.ProductID);

      const productResponse = {
        ...found,
        ProductAttributes: {
          results: attrs
        }
      };
      return sendOData(res, productResponse, true);
    }
    return sendOData(res, products);
  }

  // 6. OrderItems
  if (reqUrl.includes('/OrderItems')) {
    const keyMatch = reqUrl.match(/OrderItems\(['"]?([^)'"]+)['"]?\)/);
    if (keyMatch) {
      return sendOData(res, orderItems[0], true);
    }

    const filter = (req.query.$filter as string) || '';
    if (filter) {
      const soMatch = filter.match(/SalesOrderNumber\s+eq\s+['"]?([^'"]+)['"]?/);
      if (soMatch) {
        const filtered = orderItems.filter(i => i.SalesOrderNumber === soMatch[1]);
        return sendOData(res, filtered.length > 0 ? filtered : orderItems);
      }
    }
    return sendOData(res, orderItems);
  }

  // 7. Other EntitySets
  if (reqUrl.includes('/PartnerAddresses')) return sendOData(res, partnerAddresses);
  if (reqUrl.includes('/ProductAttributes')) return sendOData(res, productAttributes);
  if (reqUrl.includes('/ProductImages')) return sendOData(res, productImages);
  if (reqUrl.includes('/Addonn')) return sendOData(res, addons);

  return sendOData(res, []);
});

// Configure MIME types for static SAPUI5 files
express.static.mime.define({
  'text/plain; charset=utf-8': ['properties'],
  'application/xml; charset=utf-8': ['xml'],
  'application/json; charset=utf-8': ['json']
});

// Static assets
app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['html', 'js', 'json', 'xml', 'css', 'properties']
}));

// Route for /test and /test/mockindex.html
app.get('/test', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'test', 'mockindex.html'));
});

// Default fallback to index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[SAPUI5 SD_SO_CRE] Server running at http://${HOST}:${PORT}`);
  console.log(`[SAPUI5 SD_SO_CRE] OData mock service available at http://${HOST}:${PORT}${ODATA_BASE}/`);
});
