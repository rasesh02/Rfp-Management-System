-- 04_seed.sql
-- Seed Vendors (5 vendors)

INSERT INTO vendors (id, name, contact_email, contact_person, contact_phone, metadata)
VALUES
  (uuid_generate_v4(), 'Acme Supplies Ltd.', 'sales@acme.com', 'Priya Sharma', '+91-9876543210', '{"categories":["IT","Electronics"]}'),
  (uuid_generate_v4(), 'GlobeTech Pvt Ltd', 'contact@globetech.com', 'Amit Verma', '+91-9123456780', '{"categories":["Hardware","Networking"]}'),
  (uuid_generate_v4(), 'OfficeMart India', 'support@officemart.in', 'Rohit Malhotra', '+91-9812345678', '{"categories":["Office Furniture"]}'),
  (uuid_generate_v4(), 'SecureVision Systems', 'info@securevision.com', 'Neha Kulkarni', '+91-9988776655', '{"categories":["Security","CCTV"]}'),
  (uuid_generate_v4(), 'NetLink Solutions', 'sales@netlink.com', 'Suresh Nayak', '+91-9090909090', '{"categories":["Networking","Routers"]}');


-- ===========================================================================
-- Seed RFPs (5 RFPs)
-- ===========================================================================

INSERT INTO rfps (id, title, description, structured, status)
VALUES
  (
    uuid_generate_v4(),
    'RFP - 20 Laptops',
    'We need 20 business laptops with 16GB RAM, 512GB SSD, 3-year warranty.',
    jsonb_build_object(
      'items', jsonb_build_array(jsonb_build_object(
        'name','Business Laptop','qty',20,'specs',jsonb_build_object('ram','16GB','storage','512GB','warranty','3 years')
      )),
      'delivery_days', 30,
      'payment_terms', 'Net 30'
    ),
    'draft'
  ),
  (
    uuid_generate_v4(),
    'RFP - 2 Rack Servers',
    'Proposal required for 2 high-performance rack servers.',
    jsonb_build_object(
      'items', jsonb_build_array(jsonb_build_object(
        'name','Rack Server','qty',2,'specs',jsonb_build_object('cpu','Xeon 24-core','ram','64GB','storage','2TB NVMe')
      )),
      'delivery_days', 45,
      'payment_terms', 'Net 45'
    ),
    'draft'
  ),
  (
    uuid_generate_v4(),
    'RFP - 50 Office Chairs',
    'Need ergonomic office chairs with lumbar support.',
    jsonb_build_object(
      'items', jsonb_build_array(jsonb_build_object(
        'name','Ergonomic Office Chair','qty',50,'specs',jsonb_build_object('material','Mesh','support','Lumbar','armrest','Adjustable')
      )),
      'delivery_days', 20,
      'payment_terms', 'Advance 20%'
    ),
    'draft'
  ),
  (
    uuid_generate_v4(),
    'RFP - CCTV Camera Setup',
    'Need installation and supply of 25 CCTV cameras for office floors.',
    jsonb_build_object(
      'items', jsonb_build_array(jsonb_build_object(
        'name','CCTV Camera','qty',25,'specs',jsonb_build_object('resolution','1080p','type','Dome','features','Night Vision')
      )),
      'delivery_days', 30,
      'payment_terms', 'Net 30'
    ),
    'draft'
  ),
  (
    uuid_generate_v4(),
    'RFP - 10 Enterprise Routers',
    'Need 10 enterprise-grade routers with dual-band WAN support.',
    jsonb_build_object(
      'items', jsonb_build_array(jsonb_build_object(
        'name','Enterprise Router','qty',10,'specs',jsonb_build_object('wifi','WiFi 6','ports','8 LAN','wan','Dual-Band')
      )),
      'delivery_days', 25,
      'payment_terms', 'Net 30'
    ),
    'draft'
  );
