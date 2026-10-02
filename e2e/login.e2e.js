import { test, expect } from '@playwright/test';

test('la pantalla de acceso carga sin romper el flujo público', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (error) => errores.push(error.message));

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Ventas & GP Coins' })).toBeVisible();
  await expect(page.getByText('Captación · Vodafone + Lowi')).toBeVisible();
  await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();
  await expect(page.getByText('Solo usuarios autorizados.')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Vodafone' })).toBeVisible();

  expect(errores).toEqual([]);
});

test('el acceso sigue siendo usable en una pantalla móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const boton = page.getByRole('button', { name: /Continuar con Google/i });
  await expect(boton).toBeVisible();
  await expect(boton).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Ventas & GP Coins' })).toBeVisible();
});
