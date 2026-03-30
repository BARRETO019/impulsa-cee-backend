# Arquitectura Backend

## Estructura general

El backend está organizado por módulos funcionales siguiendo una arquitectura por capas:

- presentation → controllers / routes
- application → casos de uso
- infrastructure → repositorios / acceso a datos

## Módulos actuales

- auth
- visits
- buildings
- envelope
- windows
- installations
- documents

## Código legacy temporal

Actualmente permanece fuera de módulos:

- legacy/visit.controller.js → subida de fotos generales
- services/* → integraciones técnicas compartidas
- middleware/* → autenticación, roles, subida de archivos

## Objetivo futuro

Separar también:
- photos
- integrations (airtable / drive / oauth)