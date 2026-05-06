export type Locale = 'es-ES' | 'es-419' | 'en-US';

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: 'es-ES',  label: 'Español (España)',        flag: '🇪🇸' },
  { id: 'es-419', label: 'Español (Latinoamérica)', flag: '🌎' },
  { id: 'en-US',  label: 'English',                 flag: '🇺🇸' },
];

export type TranslationMap = {
  home_title: string; home_subtitle: string; home_notifications_label: string;
  home_notif_sheet_title: string; home_notif_sheet_empty: string;
  home_status_ring_in_use: string; home_status_no_ring: string; home_status_ring_free: string;
  home_info_remove_by: string; home_info_days: string; home_info_at_time: string;
  home_info_days_of: (n: number) => string;
  home_info_ready_title: string; home_info_ready_body: string;
  home_info_next_insert: string; home_info_free_period: string;
  home_step_inserted: string; home_step_ongoing: string; home_step_remove: string;
  home_action_remove: string; home_action_insert_new: string; home_action_insert: string;
  home_action_hint: string;
  home_sheet_now: string; home_sheet_choose: string; home_sheet_cancel: string;
  home_sheet_title_remove: string; home_sheet_title_insert: string;
  home_alert_early_title: string; home_alert_late_title: string;
  home_alert_early_body: (hours: number) => string;
  home_alert_late_body: (hours: number) => string;
  home_alert_insert_early_title: string;
  home_alert_insert_early_body: (hours: number) => string;
  home_alert_prospectus_hint: string;
  home_alert_cancel: string; home_alert_confirm: string; home_alert_error: string;
  calendar_title: string; calendar_legend_active: string; calendar_legend_free: string;
  calendar_legend_insert: string; calendar_legend_remove: string;
  calendar_legend_ring: string; calendar_legend_planned_remove: string; calendar_legend_planned_insert: string;
  calendar_edit_title_insert: string; calendar_edit_title_remove: string;
  calendar_edit_date_label: string; calendar_edit_time_label: string;
  calendar_edit_save: string; calendar_edit_cancel: string;
  calendar_edit_error_future: string; calendar_edit_error_before_insert: string;
  calendar_edit_error_after_remove: string; calendar_edit_error_db: string;
  luna_title: string; luna_cycle_from: (date: string) => string; luna_no_cycle: string;
  luna_period_btn: string; luna_today_label: (day: number) => string;
  luna_legend_period: string; luna_legend_today: string; luna_legend_tap: string;
  luna_period_btn_a11y: string;
  period_modal_title: string; period_modal_subtitle: string;
  period_opt_today: string; period_opt_yesterday: string;
  period_opt_2days: string; period_opt_3days: string; period_opt_4days: string;
  period_opt_other: string; period_confirm: string; period_cancel: string;
  day_modal_day: (n: number) => string; day_modal_save: (n: number) => string;
  day_tab_color: string; day_tab_feelings: string; day_tab_notes: string; day_tab_dreams: string;
  day_color_name_placeholder: string; day_color_no_name: string; day_color_clear: string;
  day_symbol_label: string; day_tags_label: string;
  day_notes_placeholder: string; day_dreams_subtitle: string; day_dreams_placeholder: string;
  day_moon_new: string; day_moon_waxing: string; day_moon_full: string; day_moon_waning: string;
  settings_title: string; settings_kofi_title: string; settings_kofi_body: string;
  settings_privacy_title: string; settings_privacy_body: string;
  settings_section_regimen: string;
  settings_regimen_cyclic_label: string; settings_regimen_cyclic_desc: string;
  settings_regimen_continuous_label: string; settings_regimen_continuous_desc: (days: number) => string;
  settings_section_duration: string; settings_days_per_ring: string; settings_days_range: string;
  settings_decrease_days: string; settings_increase_days: string;
  settings_section_help: string; settings_prospectus_title: string; settings_prospectus_desc: string;
  settings_feedback_title: string; settings_feedback_desc: string; settings_feedback_error: string;
  settings_section_data: string; settings_backup_title: string; settings_backup_desc: string;
  settings_section_language: string;
  settings_section_appearance: string;
  settings_theme_system: string; settings_theme_light: string; settings_theme_dark: string;
  settings_delete_btn: string; settings_delete_title: string; settings_delete_body: string;
  settings_delete_cancel: string; settings_delete_confirm: string;
  settings_delete_done_title: string; settings_delete_done_body: string; settings_delete_error: string;
  settings_version: string; settings_tagline: string;
  backup_title: string; backup_subtitle: string; backup_back: string;
  backup_export_title: string; backup_export_body: string;
  backup_import_title: string; backup_import_body: string;
  backup_warning_bold: string; backup_warning_body: string;
  backup_privacy_body: string; backup_format_label: string; backup_format_body: string;
  backup_confirm_title: string; backup_confirm_body: string;
  backup_confirm_cancel: string; backup_confirm_restore: string;
  backup_success_title: string; backup_success_body: string;
  backup_error_export: string; backup_error_import: string;
  backup_error_no_settings: string; backup_error_no_share: string; backup_error_invalid: string;
  notif_remove_title: string; notif_remove_body: string;
  notif_insert_title: string; notif_insert_body: string;
  tag_energy_high: string; tag_energy_low: string; tag_pain: string; tag_cramps: string;
  tag_joy: string; tag_sadness: string; tag_irritable: string; tag_calm: string;
  tag_libido_high: string; tag_libido_low: string;
  tag_sleep_good: string; tag_sleep_bad: string; tag_bloating: string; tag_clear_mind: string;
};

const translations: Record<Locale, TranslationMap> = {
  'es-ES': {
    // ── Home ──────────────────────────────────────────────────────────────
    home_title: 'Hola',
    home_subtitle: 'Estado de tu anillo',
    home_notifications_label: 'Notificaciones',
    home_status_ring_in_use: 'Insertado',
    home_notif_sheet_title: 'Próximas notificaciones',
    home_notif_sheet_empty: 'No hay notificaciones pendientes.',
    home_status_no_ring: 'Sin anillo',
    home_status_ring_free: 'Período libre',
    home_info_remove_by: 'Retirar antes del',
    home_info_days: 'DÍAS',
    home_info_at_time: 'a las',
    home_info_days_of: (n: number) => `de ${n}`,
    home_info_ready_title: '¿Lista para empezar?',
    home_info_ready_body: 'Inserta tu anillo y comienza el seguimiento de tu ciclo.',
    home_info_next_insert: 'Próxima inserción',
    home_info_free_period: 'Período libre',
    home_step_inserted: 'Insertado',
    home_step_ongoing: 'En curso',
    home_step_remove: 'Retirar',
    home_action_remove: 'Registrar Retirada del Anillo',
    home_action_insert_new: 'Insertar Nuevo Anillo',
    home_action_insert: 'Registrar Inserción del Anillo',
    home_action_hint: 'Abre un menú para confirmar la fecha y hora de la acción',
    home_sheet_now: 'Ahora mismo',
    home_sheet_choose: 'Elegir fecha y hora',
    home_sheet_cancel: 'Cancelar',
    home_sheet_title_remove: 'Registrar retirada',
    home_sheet_title_insert: 'Registrar inserción',
    home_alert_early_title: 'Retirada temprana',
    home_alert_late_title: 'Retirada tardía',
    home_alert_early_body: (hours: number) =>
      `Estás retirando el anillo ${hours}h antes de lo previsto. ¿Continuar?`,
    home_alert_late_body: (hours: number) =>
      `Llevas el anillo ${hours}h más de lo recomendado. Retíralo cuanto antes.`,
    home_alert_insert_early_title: '¿Insertar ahora?',
    home_alert_insert_early_body: (hours: number) =>
      `Todavía faltan ${hours}h para completar el período de descanso. ¿Estás segura de que quieres insertar el anillo ahora?`,
    home_alert_prospectus_hint: 'Si tienes dudas sobre los rangos recomendados, puedes consultar los prospectos en Ajustes.',
    home_alert_cancel: 'Cancelar',
    home_alert_confirm: 'Confirmar',
    home_alert_error: 'Error',

    // ── Calendar ──────────────────────────────────────────────────────────
    calendar_title: 'Calendario',
    calendar_legend_active: 'Activo',
    calendar_legend_free: 'Descanso',
    calendar_legend_insert: 'Inserción',
    calendar_legend_remove: 'Retirada',
    calendar_legend_ring: 'Anillo puesto',
    calendar_legend_planned_remove: 'Retirada prevista',
    calendar_legend_planned_insert: 'Inserción prevista',
    calendar_edit_title_insert: 'Editar fecha de inserción',
    calendar_edit_title_remove: 'Editar fecha de retirada',
    calendar_edit_date_label: 'Fecha',
    calendar_edit_time_label: 'Hora',
    calendar_edit_save: 'Guardar',
    calendar_edit_cancel: 'Cancelar',
    calendar_edit_error_future: 'La fecha no puede ser futura.',
    calendar_edit_error_before_insert: 'La retirada no puede ser anterior a la inserción.',
    calendar_edit_error_after_remove: 'La inserción no puede ser posterior a la retirada.',
    calendar_edit_error_db: 'Error al guardar. Inténtalo de nuevo.',

    // ── Luna ──────────────────────────────────────────────────────────────
    luna_title: 'Ciclograma',
    luna_cycle_from: (date: string) => `Ciclo desde ${date}`,
    luna_no_cycle: 'Indica el primer día de tu regla',
    luna_period_btn: '+ Menstruación',
    luna_today_label: (day: number) => `Día ${day} del ciclo · hoy`,
    luna_legend_period: 'Menstruación',
    luna_legend_today: 'Hoy',
    luna_legend_tap: 'Toca para registrar',
    luna_period_btn_a11y: 'Marcar inicio de menstruación',

    // ── Period start modal ─────────────────────────────────────────────────
    period_modal_title: '¿Cuándo empezó la regla?',
    period_modal_subtitle: 'Primer día del sangrado',
    period_opt_today: 'Hoy',
    period_opt_yesterday: 'Ayer',
    period_opt_2days: 'Hace 2 días',
    period_opt_3days: 'Hace 3 días',
    period_opt_4days: 'Hace 4 días',
    period_opt_other: 'Elegir otra fecha',
    period_confirm: 'Confirmar',
    period_cancel: 'Cancelar',

    // ── Day detail modal ───────────────────────────────────────────────────
    day_modal_day: (n: number) => `Día ${n}`,
    day_modal_save: (n: number) => `Guardar día ${n}`,
    day_tab_color: 'Color',
    day_tab_feelings: 'Emociones',
    day_tab_notes: 'Notas',
    day_tab_dreams: 'Sueños',
    day_color_name_placeholder: "¿Cómo llamas a este color? (ej: 'Rosa abuela')",
    day_color_no_name: 'Sin nombre',
    day_color_clear: 'Borrar',
    day_symbol_label: 'Símbolo del día',
    day_tags_label: 'Etiquetas',
    day_notes_placeholder: '¿Cómo te sientes hoy? Escribe libremente...',
    day_dreams_subtitle: 'Intuiciones, sueños, imágenes que han surgido...',
    day_dreams_placeholder: 'Esta noche soñé con...',
    day_moon_new: 'Luna nueva',
    day_moon_waxing: 'Cuarto creciente',
    day_moon_full: 'Luna llena',
    day_moon_waning: 'Cuarto menguante',

    // ── Settings ──────────────────────────────────────────────────────────
    settings_title: 'Ajustes',
    settings_kofi_title: 'Invita a un cafe a la creadora',
    settings_kofi_body: 'Ayuda a mantener Lua Ring gratis y sin anuncios',
    settings_privacy_title: 'Privacidad',
    settings_privacy_body: 'Tus datos nunca salen del dispositivo. Todo se almacena de forma local y privada.',
    settings_section_regimen: 'Tipo de régimen',
    settings_regimen_cyclic_label: 'Cíclico 21+7',
    settings_regimen_cyclic_desc: '21 días con anillo, 7 de descanso',
    settings_regimen_continuous_label: 'Continuo',
    settings_regimen_continuous_desc: (days: number) => `Recambio cada ${days} días sin descanso`,
    settings_section_duration: 'Duración del anillo',
    settings_days_per_ring: 'Días por anillo',
    settings_days_range: 'Entre 21 y 365 días',
    settings_decrease_days: 'Reducir días',
    settings_increase_days: 'Aumentar días',
    settings_section_help: 'Ayuda',
    settings_prospectus_title: 'Centro de información y prospectos',
    settings_prospectus_desc: 'Prospectos oficiales CIMA / AEMPS',
    settings_feedback_title: 'Enviar feedback',
    settings_feedback_desc: 'Cuéntanos qué mejorar o qué echas en falta',
    settings_feedback_error: 'No se puede abrir el cliente de correo.',
    settings_section_data: 'Datos',
    settings_backup_title: 'Exportar / Importar',
    settings_backup_desc: 'Copia de seguridad local',
    settings_section_language: 'Idioma',
    settings_section_appearance: 'Apariencia',
    settings_theme_system: 'Sistema', settings_theme_light: 'Claro', settings_theme_dark: 'Oscuro',
    settings_delete_btn: 'Borrar todos los datos',
    settings_delete_title: 'Borrar todos los datos',
    settings_delete_body:
      'Esto eliminará todos tus ciclos, eventos, configuración del ciclograma y registros. La app quedará como recién instalada. Esta acción no se puede deshacer.',
    settings_delete_cancel: 'Cancelar',
    settings_delete_confirm: 'Borrar todo',
    settings_delete_done_title: 'Datos eliminados',
    settings_delete_done_body: 'Cierra y vuelve a abrir la app para empezar de cero.',
    settings_delete_error: 'No se pudieron eliminar los datos.',
    settings_version: 'LUA Ring v1.0.0',
    settings_tagline: 'CONFIDENCE. CONTROL. YOU.',

    // ── Backup ────────────────────────────────────────────────────────────
    backup_title: 'Exportar / Importar datos',
    backup_subtitle: 'Tus datos, en tu dispositivo',
    backup_back: 'Volver',
    backup_export_title: 'Exportar copia de seguridad',
    backup_export_body:
      'Guarda todos tus datos en un archivo JSON que puedes guardar en tu nube o compartir con otro dispositivo.',
    backup_import_title: 'Importar copia de seguridad',
    backup_import_body: 'Restaura tus datos desde un archivo de copia de seguridad anterior.',
    backup_warning_bold: 'Importar reemplaza todos tus datos. ',
    backup_warning_body:
      'No se pueden combinar datos de dos dispositivos distintos. Asegúrate de tener una copia exportada antes de importar.',
    backup_privacy_body:
      'El archivo de copia de seguridad contiene datos personales. Guárdalo en un lugar seguro y no lo compartas con nadie.',
    backup_format_label: 'Formato · ',
    backup_format_body:
      'JSON sin cifrar. Compatible entre dispositivos con la misma versión de Lua Ring. El archivo incluye todos tus ciclos, eventos, configuración y ciclograma lunar.',
    backup_confirm_title: 'Restaurar copia de seguridad',
    backup_confirm_body:
      'Esto reemplazará TODOS tus datos actuales con los del archivo. Esta acción no se puede deshacer.',
    backup_confirm_cancel: 'Cancelar',
    backup_confirm_restore: 'Restaurar',
    backup_success_title: 'Restauración completada',
    backup_success_body:
      'Tus datos han sido restaurados. Cierra y vuelve a abrir la app para ver los cambios.',
    backup_error_export: 'Error al exportar',
    backup_error_import: 'Error al importar',
    backup_error_no_settings: 'No se encontró la configuración.',
    backup_error_no_share: 'El sistema no permite compartir archivos en este dispositivo.',
    backup_error_invalid: 'El archivo no es válido o está dañado.',

    // ── Notifications ─────────────────────────────────────────────────────
    notif_remove_title: 'Hora de retirar el anillo',
    notif_remove_body: 'Han pasado 21 días. Retíralo hoy.',
    notif_insert_title: 'Hora de insertar el anillo',
    notif_insert_body: 'El período libre ha terminado. Inserta el nuevo anillo.',

    // ── Tags ──────────────────────────────────────────────────────────────
    tag_energy_high: 'Alta energía',
    tag_energy_low: 'Poca energía',
    tag_pain: 'Dolor',
    tag_cramps: 'Cólicos',
    tag_joy: 'Alegría',
    tag_sadness: 'Tristeza',
    tag_irritable: 'Irritable',
    tag_calm: 'Calma',
    tag_libido_high: 'Deseo alto',
    tag_libido_low: 'Sin deseo',
    tag_sleep_good: 'Buen sueño',
    tag_sleep_bad: 'Mal sueño',
    tag_bloating: 'Hinchazón',
    tag_clear_mind: 'Mente clara',
  },

  // ── es-419 (Latinoamérica) ─────────────────────────────────────────────
  'es-419': {
    home_title: 'Hola',
    home_subtitle: 'Estado de tu anillo',
    home_notifications_label: 'Notificaciones',
    home_status_ring_in_use: 'Insertado',
    home_status_no_ring: 'Sin anillo',
    home_notif_sheet_title: 'Próximas notificaciones',
    home_notif_sheet_empty: 'No hay notificaciones pendientes.',
    home_status_ring_free: 'Período libre',
    home_info_remove_by: 'Retirar antes del',
    home_info_days: 'DÍAS',
    home_info_at_time: 'a las',
    home_info_days_of: (n: number) => `de ${n}`,
    home_info_ready_title: '¿Lista para empezar?',
    home_info_ready_body: 'Inserta tu anillo y comienza el seguimiento de tu ciclo.',
    home_info_next_insert: 'Próxima inserción',
    home_info_free_period: 'Período libre',
    home_step_inserted: 'Insertado',
    home_step_ongoing: 'En uso',
    home_step_remove: 'Retirar',
    home_action_remove: 'Registrar Retiro del Anillo',
    home_action_insert_new: 'Insertar Nuevo Anillo',
    home_action_insert: 'Registrar Inserción del Anillo',
    home_action_hint: 'Abre un menú para confirmar la fecha y hora de la acción',
    home_sheet_now: 'Ahora mismo',
    home_sheet_choose: 'Elegir fecha y hora',
    home_sheet_cancel: 'Cancelar',
    home_sheet_title_remove: 'Registrar retiro',
    home_sheet_title_insert: 'Registrar inserción',
    home_alert_early_title: 'Retiro anticipado',
    home_alert_late_title: 'Retiro tardío',
    home_alert_early_body: (hours: number) =>
      `Estás retirando el anillo ${hours}h antes de lo previsto. ¿Continuar?`,
    home_alert_late_body: (hours: number) =>
      `Llevas el anillo ${hours}h más de lo recomendado. Retíralo cuanto antes.`,
    home_alert_insert_early_title: '¿Insertar ahora?',
    home_alert_insert_early_body: (hours: number) =>
      `Todavía faltan ${hours}h para completar el período de descanso. ¿Estás segura de que querés insertar el anillo ahora?`,
    home_alert_prospectus_hint: 'Si tenés dudas sobre los rangos recomendados, podés consultar los prospectos en Ajustes.',
    home_alert_cancel: 'Cancelar',
    home_alert_confirm: 'Confirmar',
    home_alert_error: 'Error',

    calendar_title: 'Calendario',
    calendar_legend_active: 'Activo',
    calendar_legend_free: 'Descanso',
    calendar_legend_insert: 'Inserción',
    calendar_legend_remove: 'Retiro',
    calendar_legend_ring: 'Anillo puesto',
    calendar_legend_planned_remove: 'Retiro previsto',
    calendar_legend_planned_insert: 'Inserción prevista',
    calendar_edit_title_insert: 'Editar fecha de inserción',
    calendar_edit_title_remove: 'Editar fecha de retiro',
    calendar_edit_date_label: 'Fecha',
    calendar_edit_time_label: 'Hora',
    calendar_edit_save: 'Guardar',
    calendar_edit_cancel: 'Cancelar',
    calendar_edit_error_future: 'La fecha no puede ser futura.',
    calendar_edit_error_before_insert: 'El retiro no puede ser anterior a la inserción.',
    calendar_edit_error_after_remove: 'La inserción no puede ser posterior al retiro.',
    calendar_edit_error_db: 'Error al guardar. Inténtalo de nuevo.',

    luna_title: 'Ciclograma',
    luna_cycle_from: (date: string) => `Ciclo desde ${date}`,
    luna_no_cycle: 'Indica el primer día de tu período',
    luna_period_btn: '+ Menstruación',
    luna_today_label: (day: number) => `Día ${day} del ciclo · hoy`,
    luna_legend_period: 'Menstruación',
    luna_legend_today: 'Hoy',
    luna_legend_tap: 'Toca para registrar',
    luna_period_btn_a11y: 'Marcar inicio de menstruación',

    period_modal_title: '¿Cuándo comenzó el período?',
    period_modal_subtitle: 'Primer día del sangrado',
    period_opt_today: 'Hoy',
    period_opt_yesterday: 'Ayer',
    period_opt_2days: 'Hace 2 días',
    period_opt_3days: 'Hace 3 días',
    period_opt_4days: 'Hace 4 días',
    period_opt_other: 'Elegir otra fecha',
    period_confirm: 'Confirmar',
    period_cancel: 'Cancelar',

    day_modal_day: (n: number) => `Día ${n}`,
    day_modal_save: (n: number) => `Guardar día ${n}`,
    day_tab_color: 'Color',
    day_tab_feelings: 'Emociones',
    day_tab_notes: 'Notas',
    day_tab_dreams: 'Sueños',
    day_color_name_placeholder: "¿Cómo llamas a este color? (ej: 'Rosa abuela')",
    day_color_no_name: 'Sin nombre',
    day_color_clear: 'Borrar',
    day_symbol_label: 'Símbolo del día',
    day_tags_label: 'Etiquetas',
    day_notes_placeholder: '¿Cómo te sientes hoy? Escribe libremente...',
    day_dreams_subtitle: 'Intuiciones, sueños, imágenes que han surgido...',
    day_dreams_placeholder: 'Esta noche soñé con...',
    day_moon_new: 'Luna nueva',
    day_moon_waxing: 'Cuarto creciente',
    day_moon_full: 'Luna llena',
    day_moon_waning: 'Cuarto menguante',

    settings_title: 'Ajustes',
    settings_kofi_title: 'Invita un café a la creadora',
    settings_kofi_body: 'Ayuda a mantener Lua Ring gratis y sin anuncios',
    settings_privacy_title: 'Privacidad',
    settings_privacy_body: 'Tus datos nunca salen del dispositivo. Todo se almacena de forma local y privada.',
    settings_section_regimen: 'Tipo de régimen',
    settings_regimen_cyclic_label: 'Cíclico 21+7',
    settings_regimen_cyclic_desc: '21 días con anillo, 7 de descanso',
    settings_regimen_continuous_label: 'Continuo',
    settings_regimen_continuous_desc: (days: number) => `Cambio cada ${days} días sin descanso`,
    settings_section_duration: 'Duración del anillo',
    settings_days_per_ring: 'Días por anillo',
    settings_days_range: 'Entre 21 y 365 días',
    settings_decrease_days: 'Reducir días',
    settings_increase_days: 'Aumentar días',
    settings_section_help: 'Ayuda',
    settings_prospectus_title: 'Centro de información y prospectos',
    settings_prospectus_desc: 'Prospectos oficiales',
    settings_feedback_title: 'Enviar feedback',
    settings_feedback_desc: 'Cuéntanos qué mejorar o qué te falta',
    settings_feedback_error: 'No se puede abrir el cliente de correo.',
    settings_section_data: 'Datos',
    settings_backup_title: 'Exportar / Importar',
    settings_backup_desc: 'Copia de seguridad local',
    settings_section_language: 'Idioma',
    settings_section_appearance: 'Apariencia',
    settings_theme_system: 'Sistema', settings_theme_light: 'Claro', settings_theme_dark: 'Oscuro',
    settings_delete_btn: 'Borrar todos los datos',
    settings_delete_title: 'Borrar todos los datos',
    settings_delete_body:
      'Esto eliminará todos tus ciclos, eventos, configuración del ciclograma y registros. La app quedará como recién instalada. Esta acción no se puede deshacer.',
    settings_delete_cancel: 'Cancelar',
    settings_delete_confirm: 'Borrar todo',
    settings_delete_done_title: 'Datos eliminados',
    settings_delete_done_body: 'Cierra y vuelve a abrir la app para empezar de cero.',
    settings_delete_error: 'No se pudieron eliminar los datos.',
    settings_version: 'LUA Ring v1.0.0',
    settings_tagline: 'CONFIDENCE. CONTROL. YOU.',

    backup_title: 'Exportar / Importar datos',
    backup_subtitle: 'Tus datos, en tu dispositivo',
    backup_back: 'Volver',
    backup_export_title: 'Exportar copia de seguridad',
    backup_export_body:
      'Guarda todos tus datos en un archivo JSON que podés guardar en tu nube o compartir con otro dispositivo.',
    backup_import_title: 'Importar copia de seguridad',
    backup_import_body: 'Restaura tus datos desde un archivo de copia de seguridad anterior.',
    backup_warning_bold: 'Importar reemplaza todos tus datos. ',
    backup_warning_body:
      'No se pueden combinar datos de dos dispositivos distintos. Asegurate de tener una copia exportada antes de importar.',
    backup_privacy_body:
      'El archivo de copia de seguridad contiene datos personales. Guardalo en un lugar seguro y no lo compartas con nadie.',
    backup_format_label: 'Formato · ',
    backup_format_body:
      'JSON sin cifrar. Compatible entre dispositivos con la misma versión de Lua Ring. El archivo incluye todos tus ciclos, eventos, configuración y ciclograma lunar.',
    backup_confirm_title: 'Restaurar copia de seguridad',
    backup_confirm_body:
      'Esto reemplazará TODOS tus datos actuales con los del archivo. Esta acción no se puede deshacer.',
    backup_confirm_cancel: 'Cancelar',
    backup_confirm_restore: 'Restaurar',
    backup_success_title: 'Restauración completada',
    backup_success_body:
      'Tus datos han sido restaurados. Cierra y vuelve a abrir la app para ver los cambios.',
    backup_error_export: 'Error al exportar',
    backup_error_import: 'Error al importar',
    backup_error_no_settings: 'No se encontró la configuración.',
    backup_error_no_share: 'El sistema no permite compartir archivos en este dispositivo.',
    backup_error_invalid: 'El archivo no es válido o está dañado.',

    notif_remove_title: 'Hora de retirar el anillo',
    notif_remove_body: 'Pasaron 21 días. Retíralo hoy.',
    notif_insert_title: 'Hora de insertar el anillo',
    notif_insert_body: 'El período libre terminó. Insertá el nuevo anillo.',

    tag_energy_high: 'Alta energía',
    tag_energy_low: 'Poca energía',
    tag_pain: 'Dolor',
    tag_cramps: 'Cólicos',
    tag_joy: 'Alegría',
    tag_sadness: 'Tristeza',
    tag_irritable: 'Irritable',
    tag_calm: 'Calma',
    tag_libido_high: 'Deseo alto',
    tag_libido_low: 'Sin deseo',
    tag_sleep_good: 'Buen sueño',
    tag_sleep_bad: 'Mal sueño',
    tag_bloating: 'Hinchazón',
    tag_clear_mind: 'Mente clara',
  },

  // ── en-US ──────────────────────────────────────────────────────────────
  'en-US': {
    home_title: 'Hello',
    home_subtitle: 'Your ring status',
    home_notifications_label: 'Notifications',
    home_notif_sheet_title: 'Upcoming notifications',
    home_notif_sheet_empty: 'Log your first cycle to activate reminders.',
    home_status_ring_in_use: 'Active',
    home_status_no_ring: 'No ring',
    home_status_ring_free: 'Ring-free',
    home_info_remove_by: 'Remove by',
    home_info_days: 'DAYS',
    home_info_at_time: 'at',
    home_info_days_of: (n: number) => `of ${n}`,
    home_info_ready_title: 'Ready to start?',
    home_info_ready_body: 'Insert your ring and begin tracking your cycle.',
    home_info_next_insert: 'Next insertion',
    home_info_free_period: 'Ring-free',
    home_step_inserted: 'Inserted',
    home_step_ongoing: 'Ongoing',
    home_step_remove: 'Remove',
    home_action_remove: 'Log Ring Removal',
    home_action_insert_new: 'Insert New Ring',
    home_action_insert: 'Log Ring Insertion',
    home_action_hint: 'Opens a menu to confirm the date and time of the action',
    home_sheet_now: 'Right now',
    home_sheet_choose: 'Choose date and time',
    home_sheet_cancel: 'Cancel',
    home_sheet_title_remove: 'Log removal',
    home_sheet_title_insert: 'Log insertion',
    home_alert_early_title: 'Early removal',
    home_alert_late_title: 'Late removal',
    home_alert_early_body: (hours: number) =>
      `You are removing the ring ${hours}h earlier than planned. Continue?`,
    home_alert_late_body: (hours: number) =>
      `You have worn the ring ${hours}h longer than recommended. Remove it as soon as possible.`,
    home_alert_insert_early_title: 'Insert now?',
    home_alert_insert_early_body: (hours: number) =>
      `There are still ${hours}h left in your ring-free period. Are you sure you want to insert the ring now?`,
    home_alert_prospectus_hint: 'If you have questions about recommended timeframes, you can check the package inserts in Settings.',
    home_alert_cancel: 'Cancel',
    home_alert_confirm: 'Confirm',
    home_alert_error: 'Error',

    calendar_title: 'Calendar',
    calendar_legend_active: 'Active',
    calendar_legend_free: 'Ring-free',
    calendar_legend_insert: 'Insertion',
    calendar_legend_remove: 'Removal',
    calendar_legend_ring: 'Ring in use',
    calendar_legend_planned_remove: 'Planned removal',
    calendar_legend_planned_insert: 'Planned insertion',
    calendar_edit_title_insert: 'Edit insertion date',
    calendar_edit_title_remove: 'Edit removal date',
    calendar_edit_date_label: 'Date',
    calendar_edit_time_label: 'Time',
    calendar_edit_save: 'Save',
    calendar_edit_cancel: 'Cancel',
    calendar_edit_error_future: 'Date cannot be in the future.',
    calendar_edit_error_before_insert: 'Removal cannot be before insertion.',
    calendar_edit_error_after_remove: 'Insertion cannot be after removal.',
    calendar_edit_error_db: 'Error saving. Please try again.',

    luna_title: 'Cycle chart',
    luna_cycle_from: (date: string) => `Cycle from ${date}`,
    luna_no_cycle: 'Set the first day of your period',
    luna_period_btn: '+ Period',
    luna_today_label: (day: number) => `Day ${day} of cycle · today`,
    luna_legend_period: 'Period',
    luna_legend_today: 'Today',
    luna_legend_tap: 'Tap to log',
    luna_period_btn_a11y: 'Mark period start',

    period_modal_title: 'When did your period start?',
    period_modal_subtitle: 'First day of bleeding',
    period_opt_today: 'Today',
    period_opt_yesterday: 'Yesterday',
    period_opt_2days: '2 days ago',
    period_opt_3days: '3 days ago',
    period_opt_4days: '4 days ago',
    period_opt_other: 'Choose another date',
    period_confirm: 'Confirm',
    period_cancel: 'Cancel',

    day_modal_day: (n: number) => `Day ${n}`,
    day_modal_save: (n: number) => `Save day ${n}`,
    day_tab_color: 'Color',
    day_tab_feelings: 'Feelings',
    day_tab_notes: 'Notes',
    day_tab_dreams: 'Dreams',
    day_color_name_placeholder: "What do you call this color? (e.g. 'Grandma pink')",
    day_color_no_name: 'No name',
    day_color_clear: 'Clear',
    day_symbol_label: "Day's symbol",
    day_tags_label: 'Tags',
    day_notes_placeholder: 'How are you feeling today? Write freely...',
    day_dreams_subtitle: 'Intuitions, dreams, images that have come up...',
    day_dreams_placeholder: 'Last night I dreamed of...',
    day_moon_new: 'New moon',
    day_moon_waxing: 'First quarter',
    day_moon_full: 'Full moon',
    day_moon_waning: 'Last quarter',

    settings_title: 'Settings',
    settings_kofi_title: 'Buy the creator a coffee',
    settings_kofi_body: 'Help keep Lua Ring free and ad-free',
    settings_privacy_title: 'Privacy',
    settings_privacy_body: 'Your data never leaves your device. Everything is stored locally and privately.',
    settings_section_regimen: 'Regimen type',
    settings_regimen_cyclic_label: 'Cyclic 21+7',
    settings_regimen_cyclic_desc: '21 days with ring, 7 ring-free',
    settings_regimen_continuous_label: 'Continuous',
    settings_regimen_continuous_desc: (days: number) => `Change every ${days} days without a break`,
    settings_section_duration: 'Ring duration',
    settings_days_per_ring: 'Days per ring',
    settings_days_range: 'Between 21 and 365 days',
    settings_decrease_days: 'Decrease days',
    settings_increase_days: 'Increase days',
    settings_section_help: 'Help',
    settings_prospectus_title: 'Information center',
    settings_prospectus_desc: 'Official product leaflets',
    settings_feedback_title: 'Send feedback',
    settings_feedback_desc: 'Tell us what to improve or what you miss',
    settings_feedback_error: 'Could not open mail client.',
    settings_section_data: 'Data',
    settings_backup_title: 'Export / Import',
    settings_backup_desc: 'Local backup',
    settings_section_language: 'Language',
    settings_section_appearance: 'Appearance',
    settings_theme_system: 'System', settings_theme_light: 'Light', settings_theme_dark: 'Dark',
    settings_delete_btn: 'Delete all data',
    settings_delete_title: 'Delete all data',
    settings_delete_body:
      'This will delete all your cycles, events, cycle chart settings and logs. The app will return to its initial state. This cannot be undone.',
    settings_delete_cancel: 'Cancel',
    settings_delete_confirm: 'Delete everything',
    settings_delete_done_title: 'Data deleted',
    settings_delete_done_body: 'Close and reopen the app to start fresh.',
    settings_delete_error: 'Could not delete data.',
    settings_version: 'LUA Ring v1.0.0',
    settings_tagline: 'CONFIDENCE. CONTROL. YOU.',

    backup_title: 'Export / Import data',
    backup_subtitle: 'Your data, on your device',
    backup_back: 'Back',
    backup_export_title: 'Export backup',
    backup_export_body:
      'Save all your data as a JSON file you can store in the cloud or share with another device.',
    backup_import_title: 'Import backup',
    backup_import_body: 'Restore your data from a previous backup file.',
    backup_warning_bold: 'Importing replaces all your data. ',
    backup_warning_body:
      'You cannot merge data from two different devices. Make sure you have an exported backup before importing.',
    backup_privacy_body:
      'The backup file contains personal data. Store it somewhere safe and do not share it.',
    backup_format_label: 'Format · ',
    backup_format_body:
      'Unencrypted JSON. Compatible across devices running the same version of Lua Ring. The file includes all your cycles, events, settings and cycle chart.',
    backup_confirm_title: 'Restore backup',
    backup_confirm_body:
      'This will replace ALL your current data with the data from the file. This cannot be undone.',
    backup_confirm_cancel: 'Cancel',
    backup_confirm_restore: 'Restore',
    backup_success_title: 'Restore complete',
    backup_success_body:
      'Your data has been restored. Close and reopen the app to see the changes.',
    backup_error_export: 'Export error',
    backup_error_import: 'Import error',
    backup_error_no_settings: 'Settings not found.',
    backup_error_no_share: 'File sharing is not available on this device.',
    backup_error_invalid: 'The file is invalid or corrupted.',

    notif_remove_title: 'Time to remove your ring',
    notif_remove_body: '21 days have passed. Remove it today.',
    notif_insert_title: 'Time to insert your ring',
    notif_insert_body: 'Your ring-free period is over. Insert a new ring.',

    tag_energy_high: 'High energy',
    tag_energy_low: 'Low energy',
    tag_pain: 'Pain',
    tag_cramps: 'Cramps',
    tag_joy: 'Joy',
    tag_sadness: 'Sadness',
    tag_irritable: 'Irritable',
    tag_calm: 'Calm',
    tag_libido_high: 'High libido',
    tag_libido_low: 'Low libido',
    tag_sleep_good: 'Good sleep',
    tag_sleep_bad: 'Poor sleep',
    tag_bloating: 'Bloating',
    tag_clear_mind: 'Clear mind',
  },
} as const satisfies Record<Locale, TranslationMap>;

export default translations;
