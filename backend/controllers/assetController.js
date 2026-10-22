
const Asset = require("../models/assetModel");

const conditions = ["New", "Good", "Fair", "Damaged"];
const statuses = [
  "Available",
  "Assigned",
  "Under Maintenance",
  "Retired",
  "Lost"
];

const validId = (id) => /^\d+$/.test(String(id)) && Number(id) > 0;

const assetController = {
  async getAll(req, res) {
    try {
      const assets = await Asset.getAll(req.query);

      return res.status(200).json({
        count: assets.length,
        assets
      });
    } catch (error) {
      console.error("Get assets error:", error);
      return res.status(500).json({
        message: "Failed to retrieve assets"
      });
    }
  },

  async getById(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      const asset = await Asset.getById(Number(req.params.id));

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      return res.status(200).json({ asset });
    } catch (error) {
      console.error("Get asset error:", error);
      return res.status(500).json({
        message: "Failed to retrieve asset"
      });
    }
  },

  async create(req, res) {
    try {
      const {
        asset_tag,
        asset_name,
        asset_condition = "Good",
        status,
        purchase_cost
      } = req.body;

      if (
        typeof asset_tag !== "string" ||
        !asset_tag.trim() ||
        typeof asset_name !== "string" ||
        !asset_name.trim()
      ) {
        return res.status(400).json({
          message: "Asset tag and asset name are required"
        });
      }

      if (!conditions.includes(asset_condition)) {
        return res.status(400).json({
          message: "Invalid asset condition"
        });
      }

      if (status && !statuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid asset status"
        });
      }

      if (
        purchase_cost !== undefined &&
        purchase_cost !== null &&
        (!Number.isFinite(Number(purchase_cost)) ||
          Number(purchase_cost) < 0)
      ) {
        return res.status(400).json({
          message: "Purchase cost must be a non-negative number"
        });
      }

      const id = await Asset.create({
        ...req.body,
        asset_tag: asset_tag.trim(),
        asset_name: asset_name.trim(),
        asset_condition
      });

      return res.status(201).json({
        message: "Asset registered successfully",
        id
      });
    } catch (error) {
      console.error("Create asset error:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Asset tag or serial number already exists"
        });
      }

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "The assigned staff member does not exist"
        });
      }

      return res.status(500).json({
        message: "Failed to register asset"
      });
    }
  },

  async update(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      const {
        asset_tag,
        asset_name,
        asset_condition,
        status,
        purchase_cost
      } = req.body;

      if (
        typeof asset_tag !== "string" ||
        !asset_tag.trim() ||
        typeof asset_name !== "string" ||
        !asset_name.trim()
      ) {
        return res.status(400).json({
          message: "Asset tag and asset name are required"
        });
      }

      if (!conditions.includes(asset_condition)) {
        return res.status(400).json({
          message: "Invalid asset condition"
        });
      }

      if (!statuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid asset status"
        });
      }

      if (
        purchase_cost !== undefined &&
        purchase_cost !== null &&
        (!Number.isFinite(Number(purchase_cost)) ||
          Number(purchase_cost) < 0)
      ) {
        return res.status(400).json({
          message: "Purchase cost must be a non-negative number"
        });
      }

      const updated = await Asset.update(Number(req.params.id), {
        ...req.body,
        asset_tag: asset_tag.trim(),
        asset_name: asset_name.trim()
      });

      if (!updated) {
        return res.status(404).json({ message: "Asset not found" });
      }

      return res.status(200).json({
        message: "Asset updated successfully"
      });
    } catch (error) {
      console.error("Update asset error:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Asset tag or serial number already exists"
        });
      }

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "The assigned staff member does not exist"
        });
      }

      return res.status(500).json({
        message: "Failed to update asset"
      });
    }
  },

  async delete(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      const deleted = await Asset.delete(Number(req.params.id));

      if (!deleted) {
        return res.status(404).json({ message: "Asset not found" });
      }

      return res.status(200).json({
        message: "Asset deleted successfully"
      });
    } catch (error) {
      console.error("Delete asset error:", error);
      return res.status(500).json({
        message: "Failed to delete asset"
      });
    }
  },

  async assign(req, res) {
    try {
      const { id } = req.params;
      const { staff_id } = req.body;

      if (!validId(id) || !validId(staff_id)) {
        return res.status(400).json({
          message: "Valid asset ID and staff_id are required"
        });
      }

      const asset = await Asset.getById(Number(id));

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      if (asset.status === "Retired" || asset.status === "Lost") {
        return res.status(400).json({
          message: "Retired or lost assets cannot be assigned"
        });
      }

      const updated = await Asset.assign(Number(id), Number(staff_id));

      if (!updated) {
        return res.status(400).json({
          message: "Asset assignment was not changed"
        });
      }

      return res.status(200).json({
        message: "Asset assigned successfully"
      });
    } catch (error) {
      console.error("Assign asset error:", error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(404).json({
          message: "Staff member not found"
        });
      }

      return res.status(500).json({
        message: "Failed to assign asset"
      });
    }
  },

  async returnAsset(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid asset ID" });
      }

      const asset = await Asset.getById(Number(req.params.id));

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      if (asset.status !== "Assigned") {
        return res.status(400).json({
          message: "This asset is not currently assigned"
        });
      }

      await Asset.returnAsset(Number(req.params.id));

      return res.status(200).json({
        message: "Asset returned successfully"
      });
    } catch (error) {
      console.error("Return asset error:", error);
      return res.status(500).json({
        message: "Failed to return asset"
      });
    }
  }
};

module.exports = assetController;
