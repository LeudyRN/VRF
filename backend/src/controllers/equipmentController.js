import { store } from "../repositories/inMemoryStore.js";

export const equipmentController = {
  list(req, res) {
    res.json({ types: store.equipmentTypes, items: store.equipment });
  },
};
