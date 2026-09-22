# GP COINS: mejoras para uso personal

Esta rama mantiene React, Vite y Firebase. No cambia tarifas comerciales ni inventa condiciones para campañas futuras.

## Correcciones verificadas una por una

| Caso de la auditoría | Resultado implementado | Prueba |
|---|---|---|
| JSON ajeno aceptado como copia vacía | Formato, versión, colecciones e IDs obligatorios; validación antes de confirmar | regresiones / personal |
| Cierre de sesión antes del debounce | Cola local escrita antes de aceptar el cambio; envío inmediato; salida espera sincronización | useCloudData |
| Snapshot remoto pisa cambios locales | Operaciones por diferencias, combinación de campos y detección de conflictos | useCloudData / transactions |
| Un guardado exitoso oculta otro fallido | Cola global; error visible mientras existan pendientes | useCloudData |
| Excel Vodafone pierde fecha de entrega | Exportación/importación conserva fecha e incidencia | regresiones |
| Baja Vodafone vuelve como pendiente | Reconoce «Dada de baja» | regresiones |
| Baja Lowi vuelve como pendiente | Reconoce «Dada de baja» | regresiones |
| Fecha española Lowi cambia de mes | Analizador explícito DD/MM/AAAA con validación | regresiones / personal |
| Venta cancelada suma comisión móvil | Excluye canceladas y bajas del cómputo móvil | regresiones |
| Clientes únicos cuenta pedidos | Identidad por DNI normalizado; sin DNI no se fusionan personas por nombre | regresiones / personal |
| 74,5 % cumple objetivo de 75 % | Compara porcentaje exacto, sin redondear para decidir | regresiones |
| Lowi cancelada deja portas pendientes | Excluye pedidos cancelados y dados de baja | regresiones |
| Filtro mensual omite entrega con GP | Incluye el mes de entrega entre los meses de impacto | regresiones |
| 49,90 se importa como cero | Analizador de importes españoles | regresiones / personal |
| Cambio a un mes de 30 días conserva 31 | Reinicia escenario y días al cambiar de mes | Comision |

Las pruebas están en `src/lib`, `src/hooks`, `src/pages` y `src/repositories`. `npm run check` ejecuta lint, pruebas y compilación.

Resultado de la instalación limpia: **242 pruebas aprobadas**, lint sin errores y build correcto. `npm audit` tras actualizar las dependencias compatibles: **0 vulnerabilidades reportadas** (21/09/2026).

## Nuevas funciones

- **Mi día:** llamadas, instalaciones, portabilidades y entregas, con prioridad para incidencias y tareas vencidas; abre el registro exacto.
- **Clientes:** ficha compartida entre Vodafone, Lowi y agenda, notas privadas e historial. Solo une registros con documento identificativo.
- **Mis ingresos:** comisión estimada, cobro registrado, diferencia, GP calculados y confirmados manualmente. No convierte GP a dinero.
- **Siguiente valla:** calcula las unidades que faltan en las tres categorías y un escenario explícito de bajo valor para un mes completo.
- **Cierre mensual:** copia del cálculo, reglas y registros implicados. Las ediciones posteriores muestran una diferencia sin recalcular la copia conservada. Es una referencia personal, no un registro contable inviolable: una restauración explícita puede sustituirla.
- **Papelera:** elimina y recupera ventas/llamadas conservando todo el registro. El borrado definitivo requiere confirmación dentro de la aplicación.
- **Recuperación:** copia anterior a restauración/migración, descarga de pendientes y resolución de conflictos archivando la cola antes de recargar la nube.
- **Fe:** favoritos y progreso se sincronizan al modificarlos y se incluyen en las nuevas copias. Los datos locales antiguos se usan como respaldo hasta esa primera modificación. La clave personal de API.Bible sigue siendo local y no se exporta.
- **Navegación:** página, operador y mes en la URL; filtros de estado recordados; búsqueda abre la ficha seleccionada.
- **Formularios:** etiquetas asociadas, mensajes dentro del formulario y diálogos con foco contenido, Escape y restitución del foco.

## Guardado y límites explícitos

1. Se guarda una operación en el navegador antes de actualizar la pantalla.
2. Firestore recibe una transacción con todas sus modificaciones. La conversión de agenda y la venta forman una sola operación.
3. Si otra sesión cambió otro campo, se combinan los cambios. Si modificó el mismo campo, se detiene la cola con un aviso; no se sobrescribe silenciosamente.
4. Un fallo conserva la cola. Se puede reintentar o archivar y recargar desde la nube. No borres los datos del navegador si necesitas recuperar cambios que todavía no llegaron a Firestore.
5. Solo una pestaña edita por navegador mediante Web Locks (requiere HTTPS y navegador compatible). Entre dispositivos hay detección de conflictos en la transacción.
6. Las transacciones admiten hasta 400 registros modificados; las migraciones hasta 399 registros. Una restauración mayor se rechaza antes de encolarla. No se divide una restauración silenciosamente porque perdería atomicidad.
7. La migración verifica contenido completo y activa el esquema v2 atómicamente, retirando los arrays legacy del documento raíz. Para migraciones mayores hace falta un procedimiento específico; la app informa de ello.
8. Notas, cierres y papelera viven en la configuración personal. Hay un límite preventivo de tamaño; exporta y depura copias antiguas cuando lo alcances.
9. La sincronización coherente v2 lee las tres colecciones tras una revisión del documento raíz. Esto prioriza consistencia para uso personal; aumenta lecturas frente a observar cada documento por separado.

## GitHub, Vercel y Firebase

### Antes de fusionar

- Revisar el resultado de CI y la Preview de Vercel, iniciando sesión con `jhussepy08@gmail.com`.
- Descargar una copia completa de los datos existentes.
- Cerrar pestañas antiguas y recargar los otros dispositivos después del despliegue, para que todos usen el nuevo protocolo de revisión.
- La configuración usa Node 22 en CI; Vercel instala exactamente el lockfile con `npm ci`.

### Publicar las reglas de acceso

**Fusionar el PR o desplegar Vercel NO publica `firestore.rules`.** La interfaz ya rechaza otras cuentas, pero la restricción de la base de datos solo queda aplicada después de publicar las reglas.

Desde el navegador, sin instalar nada en tu PC:

1. Abrir Firebase Console → proyecto `ventas-gpcoins` → Firestore Database → Reglas.
2. Copiar el contenido completo de `firestore.rules` desde esta rama de GitHub.
3. Revisar que el correo sea `jhussepy08@gmail.com` y publicar.
4. Comprobar acceso con esa cuenta verificada. Otra cuenta, un usuario sin autenticar y el acceso a un UID ajeno deben ser rechazados.

Las reglas no conceden lecturas globales de supervisor; ese menú se ha retirado. La configuración web de Firebase no es una contraseña.

### Alcance de verificación

Se ejecutaron pruebas de dominio con archivos XLSX reales, pruebas del hook y DOM simulado, pruebas de transacciones con un adaptador simulado y compilación de producción. No se escribieron datos del usuario durante la revisión.

Las pruebas de transacciones no equivalen a ejecutar un emulador Firestore. No se verificó la cuenta real, la publicación de reglas ni el flujo autenticado completo en Vercel. La revisión visual en un navegador real queda pendiente en la Preview; no se declara «cero errores» por haber pasado tests.

La compilación conserva un aviso de tamaño del paquete de Firebase; no bloquea el build. No se han actualizado las bases comerciales posteriores a septiembre de 2026.
