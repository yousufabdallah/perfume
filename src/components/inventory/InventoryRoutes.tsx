import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import InventoryDashboard from "./InventoryDashboard";
import ProductManagement from "./ProductManagement";
import InventoryTransfers from "./InventoryTransfers";
import POSSystem from "../pos/POSSystem";

const InventoryRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<InventoryDashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="transfers" element={<InventoryTransfers />} />
        <Route path="pos" element={<POSSystem />} />
      </Route>
    </Routes>
  );
};

export default InventoryRoutes;
