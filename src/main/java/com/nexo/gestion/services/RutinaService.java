package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RutinaService {
    private final RutinaRepository rutinaRepository;
    private final RutinaDetalleRepository rutinaDetalleRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SocioRepository socioRepository;
    private final EjercicioRepository ejercicioRepository;

    public RutinaService(RutinaRepository rutinaRepository, RutinaDetalleRepository rutinaDetalleRepository,
            EmpleadoRepository empleadoRepository, SocioRepository socioRepository,
            EjercicioRepository ejercicioRepository) {
        this.rutinaRepository = rutinaRepository;
        this.rutinaDetalleRepository = rutinaDetalleRepository;
        this.empleadoRepository = empleadoRepository;
        this.socioRepository = socioRepository;
        this.ejercicioRepository = ejercicioRepository;

    }

    public RutinaDTO convertirARutinaDTO(Rutina rutina) {
        List<RutinaDetalleDTO> detallesDTO = rutina.getDetalles().stream()
                .map(this::convertirADetalleDTO)
                .collect(java.util.stream.Collectors.toList());

        return new RutinaDTO(
                rutina.getIdRutina(),
                rutina.getNombre(),
                rutina.getDescripcion(),
                rutina.getEmpleado().getDni(),
                rutina.getEmpleado().getNombre(),
                rutina.getSocio() != null ? rutina.getSocio().getDni() : null,
                rutina.getSocio() != null ? rutina.getSocio().getNombre() : null,
                rutina.getFecha(),
                detallesDTO);
    }

    private RutinaDetalleDTO convertirADetalleDTO(RutinaDetalle detalle) {
        Integer idEjercicio = null;
        String nombreEjercicio = "EJERCICIO NO DISPONIBLE";
        String video = null;
        Integer idGrupo = null;

        try {
            if (detalle.getEjercicio() != null) {
                idEjercicio = detalle.getEjercicio().getIdEjercicio();
                nombreEjercicio = detalle.getEjercicio().getNombre();
                video = detalle.getEjercicio().getVideo();
                idGrupo = detalle.getEjercicio().getGrupoMuscular() != null
                        ? detalle.getEjercicio().getGrupoMuscular().getIdGrupo()
                        : null;
            }
        } catch (jakarta.persistence.EntityNotFoundException | org.hibernate.ObjectNotFoundException e) {
            nombreEjercicio = "⚠️ NO DISPONIBLE (ID_REF ERROR)";
        }

        return new RutinaDetalleDTO(
                detalle.getIdDetalle(),
                idEjercicio,
                nombreEjercicio,
                video,
                idGrupo,
                detalle.getOrden(),
                detalle.getSeries(),
                detalle.getRepeticiones(),
                detalle.getCarga(),
                detalle.getDescanso(),
                detalle.getObservacion(),
                detalle.getDia(),
                detalle.getCargas() != null ? detalle.getCargas() : java.util.List.of());
    }

    private EjercicioDTO convertirAEjercicioDTO(Ejercicio ejercicio) {
        return new EjercicioDTO(
                ejercicio.getIdEjercicio(),
                ejercicio.getNombre(),
                ejercicio.getDescripcion(),
                ejercicio.getVideo(),
                ejercicio.getGrupoMuscular() != null ? ejercicio.getGrupoMuscular().getIdGrupo() : null);
    }

    @Transactional
    public RutinaDTO crearRutina(RutinaDTO rutina) {
        if (rutinaRepository.existsByNombre(rutina.nombre())) {
            throw new ObjetoDuplicadoException("Ya existe una rutina con el nombre " + rutina.nombre());
        }

        Empleado empleado = empleadoRepository.findById(rutina.dniEmpleado()).orElseThrow(
                () -> new ObjetoNoEncontradoException("No se encontró el empleado con el dni " + rutina.dniEmpleado()));
        Socio socio = null;

        if (rutina.dniSocio() != null) {
            socio = socioRepository.findById(rutina.dniSocio()).orElseThrow(
                    () -> new ObjetoNoEncontradoException("No se encontró el socio con el dni " + rutina.dniSocio()));
        }

        Rutina nuevaRutina = new Rutina(rutina.nombre(), rutina.descripcion(), empleado, socio);
        Rutina guardada = rutinaRepository.save(nuevaRutina);
        return convertirARutinaDTO(guardada);
    }

    @Transactional
    public RutinaDTO crearRutinaConDetalles(com.nexo.gestion.dto.RutinaCreateDTO dto) {
        if (rutinaRepository.existsByNombre(dto.nombre())) {
            throw new ObjetoDuplicadoException("Ya existe una rutina con el nombre " + dto.nombre());
        }

        Empleado empleado = empleadoRepository.findById(dto.dniEmpleado())
                .orElseThrow(() -> new ObjetoNoEncontradoException("Empleado no encontrado: " + dto.dniEmpleado()));

        Socio socio = null;
        if (dto.dniSocio() != null && !dto.dniSocio().isBlank()) {
            socio = socioRepository.findById(dto.dniSocio())
                    .orElseThrow(() -> new ObjetoNoEncontradoException("Socio no encontrado: " + dto.dniSocio()));
        }

        Rutina rutina = new Rutina(dto.nombre(), dto.descripcion(), empleado, socio);

        if (dto.detalles() != null) {
            for (com.nexo.gestion.dto.RutinaDetalleRequestDTO d : dto.detalles()) {
                if (d.idEjercicio() == null) {
                    throw new ObjetoNoEncontradoException("Ejercicio no especificado en detalle");
                }

                Ejercicio ejercicio = ejercicioRepository.findById(d.idEjercicio())
                        .orElseThrow(() -> new ObjetoNoEncontradoException(
                                "Ejercicio no encontrado id: " + d.idEjercicio()));

                RutinaDetalle detalle = new RutinaDetalle(
                        rutina,
                        ejercicio,
                        d.orden(),
                        d.series(),
                        d.repeticiones(),
                        d.carga(),
                        d.descanso(),
                        d.observacion(),
                        d.dia());
                rutina.agregarDetalle(detalle);
            }
        }

        Rutina guardada = rutinaRepository.save(rutina);
        return convertirARutinaDTO(guardada);
    }

    // 🆕 OBTENER rutina por ID
    @Transactional(readOnly = true)
    public RutinaDTO obtenerRutinaPorId(Integer idRutina) {
        Rutina rutina = rutinaRepository.findByIdWithDetails(idRutina)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + idRutina));
        return convertirARutinaDTO(rutina);
    }

    // 🆕 ACTUALIZAR rutina completa
    @Transactional
    public RutinaDTO actualizarRutina(RutinaUpdateDTO dto) {
        Rutina rutina = rutinaRepository.findById(dto.idRutina())
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + dto.idRutina()));

        if (dto.nombre() != null && !dto.nombre().isBlank()) {
            rutina.setNombre(dto.nombre());
        }
        if (dto.descripcion() != null) {
            rutina.setDescripcion(dto.descripcion());
        }

        if (dto.dniSocio() != null) {
            if (dto.dniSocio().isBlank()) {
                rutina.setSocio(null);
            } else {
                Socio socio = socioRepository.findById(dto.dniSocio())
                        .orElseThrow(() -> new ObjetoNoEncontradoException("Socio no encontrado: " + dto.dniSocio()));
                rutina.setSocio(socio);
            }
        }


        List<RutinaDetalleRequestDTO> incomingDetails = dto.detalles() != null ? dto.detalles() : new java.util.ArrayList<>();
        

        java.util.Map<Long, RutinaDetalle> existingDetailsMap = new java.util.HashMap<>();
        for (RutinaDetalle d : rutina.getDetalles()) {
            existingDetailsMap.put(d.getIdDetalle(), d);
        }


        java.util.Set<Long> updatedIds = new java.util.HashSet<>();

        for (RutinaDetalleRequestDTO d : incomingDetails) {
            if (d.idEjercicio() == null) {
                throw new ObjetoNoEncontradoException("Ejercicio no especificado en detalle");
            }
            Ejercicio ejercicio = ejercicioRepository.findById(d.idEjercicio())
                    .orElseThrow(() -> new ObjetoNoEncontradoException("Ejercicio no encontrado id: " + d.idEjercicio()));

            if (d.idDetalle() != null && existingDetailsMap.containsKey(d.idDetalle())) {
                RutinaDetalle existing = existingDetailsMap.get(d.idDetalle());
                existing.setEjercicio(ejercicio);
                existing.setOrden(d.orden());
                existing.setSeries(d.series());
                existing.setRepeticiones(d.repeticiones());
                existing.setCarga(d.carga());
                existing.setDescanso(d.descanso());
                existing.setObservacion(d.observacion());
                existing.setDia(d.dia() != null ? d.dia() : 1);

                updatedIds.add(d.idDetalle());
            } else {
                RutinaDetalle newDetail = new RutinaDetalle(
                        rutina,
                        ejercicio,
                        d.orden(),
                        d.series(),
                        d.repeticiones(),
                        d.carga(),
                        d.descanso(),
                        d.observacion(),
                        d.dia() != null ? d.dia() : 1);
                rutina.agregarDetalle(newDetail);
            }
        }


        rutina.getDetalles().removeIf(d -> d.getIdDetalle() != null && !updatedIds.contains(d.getIdDetalle()));

        Rutina actualizada = rutinaRepository.save(rutina);
        return convertirARutinaDTO(actualizada);
    }

    // 🆕 ELIMINAR rutina
    @Transactional
    public void eliminarRutina(Integer idRutina) {
        if (!rutinaRepository.existsById(idRutina)) {
            throw new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + idRutina);
        }
        rutinaRepository.deleteById(idRutina);
    }

    // 🆕 ACTUALIZAR un detalle específico
    @Transactional
    public RutinaDetalleDTO actualizarDetalle(Long idDetalle, RutinaDetalleUpdateDTO dto) {
        RutinaDetalle detalle = rutinaDetalleRepository.findById(idDetalle)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Detalle no encontrado con ID: " + idDetalle));

        if (dto.idEjercicio() != null) {
            Ejercicio ejercicio = ejercicioRepository.findById(dto.idEjercicio())
                    .orElseThrow(
                            () -> new ObjetoNoEncontradoException("Ejercicio no encontrado id: " + dto.idEjercicio()));
            detalle.setEjercicio(ejercicio);
        }
        if (dto.orden() != null)
            detalle.setOrden(dto.orden());
        if (dto.series() != null)
            detalle.setSeries(dto.series());
        if (dto.repeticiones() != null)
            detalle.setRepeticiones(dto.repeticiones());
        if (dto.carga() != null)
            detalle.setCarga(dto.carga());
        if (dto.descanso() != null)
            detalle.setDescanso(dto.descanso());
        if (dto.observacion() != null)
            detalle.setObservacion(dto.observacion());
        if (dto.dia() != null)
            detalle.setDia(dto.dia());
        if (dto.cargas() != null) {
            detalle.setCargas(new java.util.ArrayList<>(dto.cargas()));
        }

        RutinaDetalle actualizada = rutinaDetalleRepository.save(detalle);
        return convertirADetalleDTO(actualizada);
    }


    @Transactional(readOnly = true)
    public java.util.List<RutinaDTO> buscarRutinas() {

        List<Rutina> allRutinas = rutinaRepository.findAll();


        java.util.Map<String, Rutina> uniqueRoutines = new java.util.HashMap<>();

        for (Rutina r : allRutinas) {
            String key = r.getNombre().trim().toLowerCase();
            
            if (!uniqueRoutines.containsKey(key)) {
                uniqueRoutines.put(key, r);
                continue;
            }

            Rutina existing = uniqueRoutines.get(key);
            

            boolean currentIsTemplate = r.getSocio() == null;
            boolean existingIsTemplate = existing.getSocio() == null;

            if (currentIsTemplate && !existingIsTemplate) {

                uniqueRoutines.put(key, r);
            } else if ((currentIsTemplate == existingIsTemplate) && (r.getIdRutina() > existing.getIdRutina())) {
                uniqueRoutines.put(key, r);
            }
        }


        return uniqueRoutines.values().stream()
                .sorted((r1, r2) -> r2.getIdRutina().compareTo(r1.getIdRutina()))
                .map(this::convertirARutinaResumenDTO)
                .collect(java.util.stream.Collectors.toList());
    }
 
    @Transactional
    public java.util.List<Integer> asignarRutinaAMultiplesSocios(Integer idRutina, java.util.List<String> dnisSocios) {
        Rutina rutinaOriginal = rutinaRepository.findById(idRutina)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + idRutina));

        java.util.List<Integer> rutinasCreadas = new java.util.ArrayList<>();

        for (String dniSocio : dnisSocios) {
            Socio socio = socioRepository.findById(dniSocio)
                    .orElseThrow(() -> new ObjetoNoEncontradoException("Socio no encontrado: " + dniSocio));

            // VALIDACION: Verificar si ya tiene asignada esta rutina como activa
            rutinaRepository.findFirstBySocioDniOrderByIdRutinaDesc(dniSocio).ifPresent(rutinaActiva -> {
                if (rutinaActiva.getNombre().equalsIgnoreCase(rutinaOriginal.getNombre())) {
                    throw new ObjetoDuplicadoException(
                            "El socio " + socio.getNombre() + " ya tiene asignada la rutina '" 
                            + rutinaOriginal.getNombre() + "' como activa.");
                }
            });

            // Crear copia de la rutina para este socio
            Rutina rutinaCopia = new Rutina(
                    rutinaOriginal.getNombre(),
                    rutinaOriginal.getDescripcion(),
                    rutinaOriginal.getEmpleado(),
                    socio);

            // Copiar detalles
            for (RutinaDetalle detalle : rutinaOriginal.getDetalles()) {
                RutinaDetalle detalleCopia = new RutinaDetalle(
                        rutinaCopia,
                        detalle.getEjercicio(),
                        detalle.getOrden(),
                        detalle.getSeries(),
                        detalle.getRepeticiones(),
                        detalle.getCarga(),
                        detalle.getDescanso(),
                        detalle.getObservacion(),
                        detalle.getDia());
                // Copiar cargas
                if (detalle.getCargas() != null && !detalle.getCargas().isEmpty()) {
                    detalleCopia.setCargas(new java.util.ArrayList<>(detalle.getCargas()));
                }
                rutinaCopia.agregarDetalle(detalleCopia);
            }

            Rutina guardada = rutinaRepository.save(rutinaCopia);
            rutinasCreadas.add(guardada.getIdRutina());
        }

        return rutinasCreadas;
    }

    public java.util.List<SocioDTO> obtenerSociosConRutina(Integer idRutinaTemplate) {
        Rutina template = rutinaRepository.findById(idRutinaTemplate)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina template no encontrada id: " + idRutinaTemplate));


        java.util.List<Rutina> asignadas = rutinaRepository.findByNombreAndSocioIsNotNull(template.getNombre());

        return asignadas.stream()
                .map(Rutina::getSocio)
                .filter(java.util.Objects::nonNull)
                .filter(socio -> {
                    return rutinaRepository.findFirstBySocioDniOrderByIdRutinaDesc(socio.getDni())
                            .map(active -> active.getNombre().equalsIgnoreCase(template.getNombre()))
                            .orElse(false);
                })
                .map(this::convertirASocioResumenDTO)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
    }

    private SocioDTO convertirASocioResumenDTO(Socio socio) {
        return new SocioDTO(
                socio.getDni(),
                socio.getNombre(),
                socio.getTelefono(),
                socio.getEmail(),
                socio.getFechaNacimiento(),
                socio.isActivo(),
                null // Rutina active not needed here to prevent recursion
        );
    }

    private RutinaDTO convertirARutinaResumenDTO(Rutina rutina) {
        return new RutinaDTO(
                rutina.getIdRutina(),
                rutina.getNombre(),
                rutina.getDescripcion(),
                rutina.getEmpleado().getDni(),
                rutina.getEmpleado().getNombre(),
                rutina.getSocio() != null ? rutina.getSocio().getDni() : null,
                rutina.getSocio() != null ? rutina.getSocio().getNombre() : null,
                rutina.getFecha(),
                java.util.Collections.emptyList());
    }


}
