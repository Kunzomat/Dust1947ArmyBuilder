import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography
} from '@mui/material';
import { Add, ContentCopy, Delete, Edit } from '@mui/icons-material';
import { ADMIN_CLONE_BUTTON_COLOR } from './adminStyles';
import useSessionStorageState from '../../hooks/useSessionStorageState';

const API_BASE = (process.env.REACT_APP_API_BASE || '/backend/army_api.php')
  .replace('/army_api.php', '');

async function catalogueApi(action, data = {}, method = 'GET') {
  const query = new URLSearchParams({ action, ...(method === 'DELETE' ? data : {}) });
  const response = await fetch(`${API_BASE}/admin_api.php?${query}`, {
    method,
    headers: {
      'X-API-Key': process.env.REACT_APP_API_KEY || '',
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {})
    },
    ...(method === 'POST' ? { body: JSON.stringify(data) } : {})
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`);
  return result;
}

const emptyAction = {
  name: '', action_type_id: '', description: '', dice_count: '', success_symbols: '', sort_order: 0
};

export default function ActionManager() {
  const [actions, setActions] = useState([]);
  const [types, setTypes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(emptyAction);
  const [filters, setFilters] = useSessionStorageState(
    'dust1947.filters.v1.admin.actions', { typeId: '', name: '' }
  );
  const typeId = typeof filters.typeId === 'string' ? filters.typeId : '';
  const nameFilter = typeof filters.name === 'string' ? filters.name : '';

  const load = async () => {
    const [actionRows, typeRows] = await Promise.all([
      catalogueApi('actions.list'), catalogueApi('action_types.list')
    ]);
    if (!Array.isArray(actionRows) || !Array.isArray(typeRows)) {
      throw new Error('Invalid action catalogue response');
    }
    setActions(actionRows);
    setTypes(typeRows);
    setLoaded(true);
  };

  useEffect(() => {
    let active = true;
    // Avoid updating an unmounted panel when switching Admin tabs.
    Promise.all([catalogueApi('actions.list'), catalogueApi('action_types.list')])
      .then(([actionRows, typeRows]) => {
        if (!Array.isArray(actionRows) || !Array.isArray(typeRows)) {
          throw new Error('Invalid action catalogue response');
        }
        if (active) {
          setActions(actionRows);
          setTypes(typeRows);
          setLoaded(true);
        }
      }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loaded && typeId && !types.some((type) => String(type.id) === typeId)) {
      setFilters((previous) => ({ ...previous, typeId: '' }));
    }
  }, [loaded, types, typeId, setFilters]);

  const visibleActions = useMemo(() => actions.filter((action) =>
    (!typeId || String(action.action_type_id) === typeId)
    && action.name.toLocaleLowerCase().includes(nameFilter.trim().toLocaleLowerCase())
  ), [actions, typeId, nameFilter]);

  const openEditor = (row = null, clone = false) => {
    setError('');
    setEditor({ isType: showTypes, row, clone });
    setDraft(showTypes ? {
      name: row ? `${row.name}${clone ? ' (Kopie)' : ''}` : '',
      code: row ? (clone ? `${row.code.slice(0, 59)}_copy` : row.code) : ''
    } : row ? {
      name: `${row.name}${clone ? ' (Kopie)' : ''}`,
      action_type_id: String(row.action_type_id),
      description: row.description,
      dice_count: row.dice_count ?? '',
      success_symbols: row.success_symbols ?? '',
      sort_order: row.sort_order
    } : { ...emptyAction, action_type_id: typeId });
  };
  const change = (field) => (event) => setDraft((previous) => ({
    ...previous, [field]: event.target.value
  }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const resource = editor.isType ? 'action_types' : 'actions';
      const operation = editor.clone ? 'clone' : editor.row ? 'update' : 'create';
      const payload = {
        ...draft,
        ...(editor.row ? { id: editor.row.id } : {}),
        ...(!editor.isType ? {
          action_type_id: Number(draft.action_type_id),
          dice_count: String(draft.dice_count).trim() === '' ? null : Number(draft.dice_count),
          success_symbols: draft.success_symbols.trim() || null,
          sort_order: Number(draft.sort_order)
        } : {})
      };
      await catalogueApi(`${resource}.${operation}`, payload, 'POST');
      setEditor(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${showTypes ? 'action type' : 'action'} "${row.name}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await catalogueApi(`${showTypes ? 'action_types' : 'actions'}.delete`, { id: row.id }, 'DELETE');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const rows = showTypes ? types : visibleActions;
  return (
    <Box>
      {error && !editor && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">{showTypes ? 'Action Types' : 'Actions'} ({rows.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!showTypes && <>
            <TextField select size="small" label="Filter by type"
              value={types.some((type) => String(type.id) === typeId) ? typeId : ''}
              sx={{ minWidth: 220 }}
              onChange={(e) => setFilters((previous) => ({ ...previous, typeId: e.target.value }))}>
              <MenuItem value="">All types</MenuItem>
              {types.map((type) => <MenuItem key={type.id} value={String(type.id)}>{type.name}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Filter by name" value={nameFilter}
              onChange={(e) => setFilters((previous) => ({ ...previous, name: e.target.value }))} />
          </>}
          <Button onClick={() => { setError(''); setShowTypes(!showTypes); }}>
            {showTypes ? 'Back to Actions' : 'Manage Action Types'}
          </Button>
          <Button variant="contained" startIcon={<Add />} disabled={!loaded || busy}
            onClick={() => openEditor()}>{showTypes ? 'New Action Type' : 'New Action'}</Button>
        </Box>
      </Box>
      {!loaded && !error && <Typography>Loading actions…</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>ID</TableCell><TableCell>Name</TableCell>
            {showTypes ? <TableCell>Code</TableCell> : <>
              <TableCell>Type</TableCell><TableCell>Description</TableCell>
              <TableCell>Dice</TableCell><TableCell>Success Symbols</TableCell><TableCell>Sort Order</TableCell>
            </>}
            <TableCell>Operations</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {rows.map((row) => <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell><TableCell>{row.name}</TableCell>
              {showTypes ? <TableCell>{row.code}</TableCell> : <>
                <TableCell>{row.action_type_name}</TableCell>
                <TableCell sx={{ whiteSpace: 'pre-wrap', minWidth: 250 }}>{row.description}</TableCell>
                <TableCell>{row.dice_count ?? '—'}</TableCell>
                <TableCell>{row.success_symbols ?? '—'}</TableCell><TableCell>{row.sort_order}</TableCell>
              </>}
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <IconButton aria-label={`Edit ${row.name}`} color="primary" disabled={busy}
                  onClick={() => openEditor(row)}><Edit /></IconButton>
                <IconButton aria-label={`Clone ${row.name}`} color={ADMIN_CLONE_BUTTON_COLOR} disabled={busy}
                  onClick={() => openEditor(row, true)}><ContentCopy /></IconButton>
                <IconButton aria-label={`Delete ${row.name}`} color="error" disabled={busy}
                  onClick={() => remove(row)}><Delete /></IconButton>
              </TableCell>
            </TableRow>)}
            {loaded && rows.length === 0 && <TableRow><TableCell colSpan={showTypes ? 4 : 9}>No entries found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={Boolean(editor)} onClose={() => { if (!busy) setEditor(null); }} fullWidth maxWidth="md">
        {editor && <Box component="form" onSubmit={save}>
          <DialogTitle>
            {editor.clone ? 'Clone' : editor.row ? 'Edit' : 'New'} {editor.isType ? 'Action Type' : 'Action'}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField autoFocus margin="dense" fullWidth required label="Name" value={draft.name}
              onChange={change('name')} slotProps={{ htmlInput: { maxLength: 255 } }} />
            {editor.isType ? <TextField margin="dense" fullWidth required label="Code" value={draft.code}
              disabled={Boolean(editor.row && !editor.clone)} onChange={change('code')}
              helperText="Stable code: lowercase letters, digits and underscores. Cannot be changed after creation."
              slotProps={{ htmlInput: { maxLength: 64, pattern: '[a-z][a-z0-9_]{0,63}' } }} /> : <>
              <TextField select margin="dense" fullWidth required label="Action Type" value={draft.action_type_id}
                onChange={change('action_type_id')}>
                {types.map((type) => <MenuItem key={type.id} value={String(type.id)}>{type.name}</MenuItem>)}
              </TextField>
              <TextField margin="dense" fullWidth required multiline minRows={5} label="Description"
                value={draft.description} onChange={change('description')}
                slotProps={{ htmlInput: { maxLength: 16000 } }} />
              <TextField margin="dense" fullWidth type="number" label="Dice Count" value={draft.dice_count}
                helperText="Leave blank for no dice (NULL)." onChange={change('dice_count')}
                slotProps={{ htmlInput: { min: 0, max: 4294967295, step: 1 } }} />
              <TextField margin="dense" fullWidth label="Success Symbols" value={draft.success_symbols}
                helperText="Leave blank for none (NULL)." onChange={change('success_symbols')}
                slotProps={{ htmlInput: { maxLength: 255 } }} />
              <TextField margin="dense" fullWidth required type="number" label="Sort Order" value={draft.sort_order}
                onChange={change('sort_order')}
                slotProps={{ htmlInput: { min: -2147483648, max: 2147483647, step: 1 } }} />
            </>}
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setEditor(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy || !draft.name.trim()
              || (!editor.isType && (!draft.action_type_id || !draft.description.trim()))}>Save</Button>
          </DialogActions>
        </Box>}
      </Dialog>
    </Box>
  );
}
