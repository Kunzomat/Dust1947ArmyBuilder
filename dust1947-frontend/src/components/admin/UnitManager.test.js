import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UnitEditDialog } from './UnitManager';

let writes;
beforeEach(() => {
  writes = [];
  global.fetch = jest.fn(async (url, options = {}) => {
    if (options.body) writes.push({ url, data: JSON.parse(options.body) });
    return { ok: true, json: async () => options.body ? { id: 42 } : [] };
  });
});
afterEach(() => { delete global.fetch; });

const existing = { id: 42, name: 'Hero', type: 'H', faction_id: 1, level: '2' };
const props = {
  open: true, factions: [{ id: 1, name: 'Faction' }], gameSystems: [],
  onClose: jest.fn(), onSaved: jest.fn(),
};

async function save(action, isUnique) {
  fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0].url).toContain(`action=units.${action}`);
  expect(writes[0].data.is_unique).toBe(isUnique);
}

test('new units start unchecked (including heroes) and save false by default', async () => {
  render(<UnitEditDialog {...props} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' })).not.toBeChecked();
  fireEvent.mouseDown(screen.getByLabelText('Type'));
  fireEvent.click(await screen.findByRole('option', { name: 'H - Hero' }));
  expect(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' })).not.toBeChecked();
  await save('create', false);
});

test('new nonheroes can be explicitly made unique', async () => {
  render(<UnitEditDialog {...props} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' }));
  await save('create', true);
});

test.each([true, 1, '1', false, 0, '0', undefined])('edit loads and saves existing flag %s', async (flag) => {
  render(<UnitEditDialog {...props} editingUnit={{ ...existing, is_unique: flag }} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  const checkbox = screen.getByRole('checkbox', { name: 'Einzigartige Einheit' });
  expect(checkbox.checked).toBe([true, 1, '1'].includes(flag));
  fireEvent.click(checkbox);
  await save('update', ![true, 1, '1'].includes(flag));
});

test('clone retains source uniqueness and can change it', async () => {
  render(<UnitEditDialog {...props} cloneSourceUnit={{ ...existing, is_unique: '1' }} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' }));
  await save('clone', false);
});

test('switching from editing a unique unit to creating one resets the checkbox', async () => {
  const view = render(<UnitEditDialog {...props} editingUnit={{ ...existing, is_unique: 1 }} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' })).toBeChecked();
  view.rerender(<UnitEditDialog {...props} />);
  expect(screen.getByRole('checkbox', { name: 'Einzigartige Einheit' })).not.toBeChecked();
});
