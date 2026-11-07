import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext.jsx';
import FoodImg from '../components/FoodImg.jsx';
import { imgSrc, rupee } from '../utils';

const EMPTY = { name: '', price: '', category: 'Lunch', description: '', available: true, imageUrl: '' };

export default function AdminFoods() {
  const [foods, setFoods] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, food = edit
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () =>
    api
      .get('/foods')
      .then((r) => {
        setFoods(r.data.foods);
        setCats(r.data.categories);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  // Local preview for a chosen file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = useMemo(
    () => foods.filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase())),
    [foods, q]
  );

  const openNew = () => {
    setEditing({});
    setForm(EMPTY);
    setFile(null);
    setPreview('');
    setFormError('');
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      name: f.name,
      price: String(f.price),
      category: f.category,
      description: f.description || '',
      available: f.available,
      imageUrl: /^https?:/i.test(f.image) ? f.image : '',
    });
    setFile(null);
    setPreview(imgSrc(f.image));
    setFormError('');
  };

  const close = () => setEditing(null);
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) return setFormError('Please choose a png, jpg, webp or gif image.');
    if (f.size > 2 * 1024 * 1024) return setFormError('Image must be smaller than 2 MB.');
    setFormError('');
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const price = Number(form.price);
    if (form.name.trim().length < 2) return setFormError('Name must be at least 2 characters.');
    if (!Number.isFinite(price) || price < 1 || price > 10000) return setFormError('Price must be between 1 and 10000.');

    const isEdit = !!editing._id;
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('price', price);
    fd.append('category', form.category);
    fd.append('description', form.description.trim());
    fd.append('available', form.available);
    if (file) fd.append('image', file);
    else if (form.imageUrl.trim() && (!isEdit || form.imageUrl.trim() !== editing.image)) fd.append('imageUrl', form.imageUrl.trim());

    setBusy(true);
    try {
      if (isEdit) await api.put(`/foods/${editing._id}`, fd);
      else await api.post('/foods', fd);
      toast(isEdit ? 'Food item updated' : 'Food item added');
      close();
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.name}" permanently?`)) return;
    try {
      await api.delete(`/foods/${f._id}`);
      setFoods((list) => list.filter((x) => x._id !== f._id));
      toast('Food item deleted');
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  const toggleAvail = async (f) => {
    const fd = new FormData();
    fd.append('name', f.name);
    fd.append('price', f.price);
    fd.append('category', f.category);
    fd.append('description', f.description || '');
    fd.append('available', !f.available);
    try {
      const r = await api.put(`/foods/${f._id}`, fd);
      setFoods((list) => list.map((x) => (x._id === f._id ? r.data.food : x)));
      toast(r.data.food.available ? 'Marked available' : 'Marked unavailable');
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Food Items</h1>
          <p className="muted">{foods.length} items on the menu</p>
        </div>
        <div className="row gap">
          <input className="search" placeholder="🔍 Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={openNew}>+ Add item</button>
        </div>
      </div>

      {loading && <div className="center-page"><div className="spinner" /></div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && shown.length === 0 && <div className="empty">No food items found.</div>}

      <div className="grid">
        {shown.map((f) => (
          <div className={`card food-card ${f.available ? '' : 'dim'}`} key={f._id}>
            <FoodImg src={f.image} alt={f.name} className="food-img" />
            <div className="food-body">
              <div className="row between">
                <span className="tag">{f.category}</span>
                <span className={`badge ${f.available ? 'badge-completed' : 'badge-cancelled'}`}>
                  {f.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <h3>{f.name}</h3>
              <p className="muted small">{f.description}</p>
              <strong className="price">{rupee(f.price)}</strong>
              <div className="row gap wrap top-gap">
                <button className="btn btn-light btn-sm" onClick={() => openEdit(f)}>Edit</button>
                <button className="btn btn-light btn-sm" onClick={() => toggleAvail(f)}>
                  {f.available ? 'Mark unavailable' : 'Mark available'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(f)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <form className="modal card" onSubmit={submit} noValidate>
            <h2>{editing._id ? 'Edit food item' : 'Add food item'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <label>Name</label>
            <input name="name" value={form.name} onChange={onChange} maxLength="60" />
            <div className="two-fields">
              <div>
                <label>Price (₹)</label>
                <input name="price" type="number" min="1" max="10000" value={form.price} onChange={onChange} />
              </div>
              <div>
                <label>Category</label>
                <select name="category" value={form.category} onChange={onChange}>
                  {cats.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <label>Description</label>
            <textarea name="description" rows="2" maxLength="300" value={form.description} onChange={onChange} />
            <label>Image (upload a file, max 2 MB)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pickFile} />
            <label>…or image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="https://…" disabled={!!file} />
            {(preview || form.imageUrl) && (
              <img className="preview" src={file ? preview : form.imageUrl ? imgSrc(form.imageUrl) : preview} alt="Preview" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
            )}
            <label className="check">
              <input type="checkbox" name="available" checked={form.available} onChange={onChange} /> Available to order
            </label>
            <div className="row gap end">
              <button type="button" className="btn btn-light" onClick={close}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
