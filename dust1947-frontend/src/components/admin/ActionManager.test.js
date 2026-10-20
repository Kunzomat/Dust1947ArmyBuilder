import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ActionManager from './ActionManager';

const initialTypes = [
  { id: 1, code: 'normal_action', name: 'Normal Action' },
  { id: 4, code: 'psyker_special_action', name: 'Psyker Special Action' }
];
const initialActions = [
  { id: 1, name: 'Psychic Veil', action_type_id: 4, description: 'Exact veil text.',
    dice_count: 1, success_symbols: 'Faction Symbol', sort_order: 0 },
  { id: 2, name: 'No dice', action_type_id: 1, description: 'No roll.',
    dice_count: null, success_symbols: null, sort_order: 1 }
];
let store;
let writes;
let nextId;

beforeEach(() => {
  sessionStorage.clear();
  store = { actions: initialActions.map((row) => ({ ...row })), action_types: initialTypes.map((row) => ({ ...row })) };
  writes = [];
  nextId = 100;
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  global.fetch = jest.fn(async (url, options) => {
    const params = new URL(url, 'http://localhost').searchParams;
    const [resource, operation] = params.get('action').split('.');
    const data = options.body ? JSON.parse(options.body) : {};
    let result;
    if (operation === 'list') {
      result = store[resource].map((row) => ({
        ...row, ...(resource === 'actions'
          ? { action_type_name: store.action_types.find((type) => type.id === Number(row.action_type_id))?.name } : {})
      }));
    } else {
      writes.push({ resource, operation, data, method: options.method });
      if (operation === 'delete') {
        const id = Number(params.get('id'));
        if (resource === 'action_types' && store.actions.some((row) => row.action_type_id === id)) {
          return { ok: false, json: async () => ({ error: 'Action type is referenced by actions and cannot be deleted' }) };
        }
        store[resource] = store[resource].filter((row) => row.id !== id);
      } else if (operation === 'update') {
        store[resource] = store[resource].map((row) => row.id === data.id ? { ...data } : row);
      } else {
        store[resource].push({ ...data, id: nextId++ });
      }
      result = { id: 100, message: 'Saved' };
    }
    return { ok: true, json: async () => result };
  });
});

afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

async function start() {
  const view = render(<ActionManager />);
  await screen.findByRole('button', { name: 'Edit Psychic Veil' });
  return view;
}

async function choose(label, option) {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(await screen.findByRole('option', { name: option }));
}

async function save() {
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

test('filters by case-insensitive name and type, persisting across remounts', async () => {
  const view = await start();
  fireEvent.change(screen.getByLabelText('Filter by name'), { target: { value: 'vEiL' } });
  await choose('Filter by type', 'Psyker Special Action');
  expect(screen.queryByRole('button', { name: 'Edit No dice' })).not.toBeInTheDocument();
  expect(JSON.parse(sessionStorage.getItem('dust1947.filters.v1.admin.actions')))
    .toEqual({ name: 'vEiL', typeId: '4' });
  view.unmount();
  await start();
  expect(screen.getByLabelText('Filter by name')).toHaveValue('vEiL');
  expect(screen.queryByRole('button', { name: 'Edit No dice' })).not.toBeInTheDocument();
  await choose('Filter by type', 'Normal Action');
  expect(screen.queryByRole('button', { name: 'Edit Psychic Veil' })).not.toBeInTheDocument();
  expect(screen.getByText('No entries found.')).toBeInTheDocument();
});

test('creates a no-dice action with actual nulls and edits dice and sort order', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'New Action', exact: true }));
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Wait' } });
  fireEvent.change(screen.getByLabelText(/^Description/), { target: { value: 'Complete definition.' } });
  await choose(/^Action Type/, 'Normal Action');
  fireEvent.change(screen.getByLabelText(/^Sort Order/), { target: { value: '-2' } });
  await save();
  expect(writes[0]).toMatchObject({
    resource: 'actions', operation: 'create', method: 'POST',
    data: { name: 'Wait', action_type_id: 1, dice_count: null, success_symbols: null, sort_order: -2 }
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Wait' }));
  expect(screen.getByLabelText('Dice Count')).toHaveValue(null);
  fireEvent.change(screen.getByLabelText('Dice Count'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Success Symbols'), { target: { value: 'Hit Symbol' } });
  await save();
  expect(writes[1]).toMatchObject({
    operation: 'update', data: { id: 100, dice_count: 2, success_symbols: 'Hit Symbol', sort_order: -2 }
  });
});

test('clones an editable draft through POST with source id, without changing source', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Clone Psychic Veil' }));
  expect(screen.getByLabelText(/^Name/)).toHaveValue('Psychic Veil (Kopie)');
  expect(screen.getByLabelText(/^Description/)).toHaveValue('Exact veil text.');
  fireEvent.change(screen.getByLabelText('Dice Count'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Success Symbols'), { target: { value: '   ' } });
  await save();
  expect(writes[0]).toMatchObject({
    operation: 'clone', method: 'POST',
    data: { id: 1, name: 'Psychic Veil (Kopie)', action_type_id: 4, dice_count: null, success_symbols: null }
  });
  expect(store.actions[0]).toEqual(initialActions[0]);
  expect(await screen.findByRole('button', { name: 'Edit Psychic Veil (Kopie)' })).toBeInTheDocument();
});

test('deletes only after confirmation and refreshes the list', async () => {
  await start();
  window.confirm.mockReturnValueOnce(false);
  fireEvent.click(screen.getByRole('button', { name: 'Delete No dice' }));
  expect(writes).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Delete No dice' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Edit No dice' })).not.toBeInTheDocument());
  expect(writes[0]).toMatchObject({ resource: 'actions', operation: 'delete', method: 'DELETE' });
});

test('manages types: create, stable-code edit, clone with new code, delete and referenced error', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Manage Action Types' }));
  fireEvent.click(screen.getByRole('button', { name: 'New Action Type' }));
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Custom' } });
  fireEvent.change(screen.getByLabelText(/^Code/), { target: { value: 'custom' } });
  await save();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Custom' }));
  expect(screen.getByLabelText(/^Code/)).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Custom edited' } });
  await save();
  expect(writes[1]).toMatchObject({ resource: 'action_types', operation: 'update', data: { code: 'custom' } });
  fireEvent.click(screen.getByRole('button', { name: 'Clone Normal Action' }));
  expect(screen.getByLabelText(/^Code/)).toHaveValue('normal_action_copy');
  expect(screen.getByLabelText(/^Code/)).not.toBeDisabled();
  await save();
  expect(writes[2]).toMatchObject({
    resource: 'action_types', operation: 'clone', data: { id: 1, name: 'Normal Action (Kopie)', code: 'normal_action_copy' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Delete Normal Action' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('referenced by actions');
  expect(screen.getByRole('button', { name: 'Edit Normal Action' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete Custom edited' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Edit Custom edited' })).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Back to Actions' }));
  expect(screen.getByRole('button', { name: 'Edit Psychic Veil' })).toBeInTheDocument();
});

test('keeps the draft open on duplicate/validation errors', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Clone No dice' }));
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'An entry with this name already exists' }) });
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  expect(screen.getByLabelText(/^Name/)).toHaveValue('No dice (Kopie)');
});

test('clears a removed persisted type only after a successful load', async () => {
  sessionStorage.setItem('dust1947.filters.v1.admin.actions', JSON.stringify({ typeId: '999', name: '' }));
  await start();
  await waitFor(() => expect(JSON.parse(sessionStorage.getItem('dust1947.filters.v1.admin.actions')).typeId).toBe(''));
  expect(screen.getByRole('button', { name: 'Edit No dice' })).toBeInTheDocument();
});
