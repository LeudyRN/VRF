# VRF Engineering Platform

## Run

```bash
npm install
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3100

## Notes

- Backend currently uses an in-memory project store for fast startup, and provides MySQL schema in `backend/src/database/schema.sql`.
- Load `data/equipmentLibrary/genericEquipment.json` with 100+ fictional HVAC units.
