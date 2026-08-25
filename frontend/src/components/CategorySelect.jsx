import { useEffect, useState } from "react";
import { addCategory, listCategories } from "../api";

export default function CategorySelect({ value, onChange, includeOverall = false }) {
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setCategories(await listCategories());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      const category = await addCategory({ name: newName.trim() });
      await refresh();
      onChange(category.name);
      setNewName("");
      setAdding(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} required style={{ flex: 1 }}>
          <option value="" disabled>
            Select category
          </option>
          {includeOverall && <option value="Overall">Overall</option>}
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" style={{ padding: "0 12px" }} onClick={() => setAdding((a) => !a)}>
          + New
        </button>
      </div>

      {adding && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-primary" style={{ padding: "6px 14px" }} onClick={handleAdd}>
            Add
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
