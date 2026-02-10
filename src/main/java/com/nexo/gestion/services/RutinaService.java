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
                rutina.getPersonalizada() != null ? rutina.getPersonalizada() : false,
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

        // Marcar como personalizada si tiene plantilla origen
        if (rutina.getIdPlantillaOrigen() != null) {
            rutina.setPersonalizada(true);
        }

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
    public PageResponseDTO<RutinaDTO> buscarPlantillas(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("idRutina").descending());
        
        org.springframework.data.domain.Page<Rutina> rutinasPage = rutinaRepository.findBySocioIsNull(pageable);
        
        return mapToPageResponse(rutinasPage);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<RutinaDTO> buscarRutinasAsignadas(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("idRutina").descending());

        org.springframework.data.domain.Page<Rutina> rutinasPage = rutinaRepository.findBySocioIsNotNull(pageable);

        return mapToPageResponse(rutinasPage);
    }

    private PageResponseDTO<RutinaDTO> mapToPageResponse(org.springframework.data.domain.Page<Rutina> page) {
        List<RutinaDTO> content = page.getContent().stream()
                .map(this::convertirARutinaResumenDTO)
                .collect(java.util.stream.Collectors.toList());

        return new PageResponseDTO<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public java.util.List<RutinaDTO> buscarRutinas() {
        // MANTENIDO POR COMPATIBILIDAD TEST (Opcional, se puede borrar si ya no se usa)
        // Retornar TODAS las rutinas para que el Frontend pueda separar Plantillas de Asignadas
        List<Rutina> allRutinas = rutinaRepository.findAll();

        return allRutinas.stream()
                .sorted((r1, r2) -> r2.getIdRutina().compareTo(r1.getIdRutina()))
                .map(this::convertirARutinaResumenDTO)
                .collect(java.util.stream.Collectors.toList());
    }
 
    @Transactional
    public List<Integer> asignarRutinaAMultiplesSocios(Integer idRutina, List<String> dnisSocios) {
        // Validar que la rutina sea plantilla
        Rutina plantilla = rutinaRepository.findById(idRutina)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + idRutina));

        if (plantilla.getSocio() != null) {
            throw new IllegalArgumentException("La rutina ID " + idRutina + " ya está asignada a un socio. Solo se pueden asignar plantillas.");
        }

        List<Integer> rutinasCreadas = new java.util.ArrayList<>();

        for (String dniSocio : dnisSocios) {
            Socio socio = socioRepository.findById(dniSocio)
                    .orElseThrow(() -> new ObjetoNoEncontradoException("Socio no encontrado con DNI: " + dniSocio));

            // Crear copia de la plantilla
            Rutina nuevaRutina = new Rutina();
            nuevaRutina.setNombre(plantilla.getNombre());
            nuevaRutina.setDescripcion(plantilla.getDescripcion());
            nuevaRutina.setEmpleado(plantilla.getEmpleado());
            nuevaRutina.setSocio(socio);
            nuevaRutina.setFecha(java.time.LocalDate.now());
            nuevaRutina.setIdPlantillaOrigen(idRutina); // Registrar plantilla origen
            nuevaRutina.setPersonalizada(false); // Inicialmente no está personalizada

            Rutina rutinaSaved = rutinaRepository.save(nuevaRutina);

            // Copiar todos los detalles
            for (RutinaDetalle detalleOriginal : plantilla.getDetalles()) {
                RutinaDetalle nuevoDetalle = new RutinaDetalle();
                nuevoDetalle.setRutina(rutinaSaved);
                nuevoDetalle.setEjercicio(detalleOriginal.getEjercicio());
                nuevoDetalle.setOrden(detalleOriginal.getOrden());
                nuevoDetalle.setSeries(detalleOriginal.getSeries());
                nuevoDetalle.setRepeticiones(detalleOriginal.getRepeticiones());
                nuevoDetalle.setCarga(detalleOriginal.getCarga());
                nuevoDetalle.setDescanso(detalleOriginal.getDescanso());
                nuevoDetalle.setObservacion(detalleOriginal.getObservacion());
                nuevoDetalle.setDia(detalleOriginal.getDia());
                if (detalleOriginal.getCargas() != null) {
                    nuevoDetalle.setCargas(new java.util.ArrayList<>(detalleOriginal.getCargas()));
                }
                rutinaSaved.agregarDetalle(nuevoDetalle);
            }

            rutinaRepository.save(rutinaSaved);
            rutinasCreadas.add(rutinaSaved.getIdRutina());
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
                rutina.getPersonalizada() != null ? rutina.getPersonalizada() : false,
                java.util.Collections.emptyList());
    }

    // 🆕 DUPLICATE: Duplicar una plantilla
    @Transactional
    public RutinaDTO duplicarPlantilla(Integer idRutina, String dniEmpleado) {
        Rutina plantilla = rutinaRepository.findById(idRutina)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + idRutina));

        // Validar que sea una plantilla
        if (plantilla.getSocio() != null) {
            throw new IllegalArgumentException("Solo se pueden duplicar plantillas (rutinas sin socio asignado)");
        }

        Empleado empleado;
        if (dniEmpleado == null || dniEmpleado.isBlank()) {
            empleado = plantilla.getEmpleado();
        } else {
            empleado = empleadoRepository.findById(dniEmpleado)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Empleado no encontrado con DNI: " + dniEmpleado));
        }

        // Crear nueva plantilla con nombre único
        String nuevoNombre = plantilla.getNombre() + " (Copia)";
        int contador = 1;
        while (rutinaRepository.existsByNombre(nuevoNombre)) {
            contador++;
            nuevoNombre = plantilla.getNombre() + " (Copia " + contador + ")";
        }

        Rutina nuevaPlantilla = new Rutina();
        nuevaPlantilla.setNombre(nuevoNombre);
        nuevaPlantilla.setDescripcion(plantilla.getDescripcion());
        nuevaPlantilla.setEmpleado(empleado);
        nuevaPlantilla.setSocio(null); // Es plantilla
        nuevaPlantilla.setFecha(java.time.LocalDate.now());
        nuevaPlantilla.setIdPlantillaOrigen(null); // Las plantillas no tienen origen
        nuevaPlantilla.setPersonalizada(false);

        Rutina plantillaSaved = rutinaRepository.save(nuevaPlantilla);

        // Copiar todos los detalles
        for (RutinaDetalle detalleOriginal : plantilla.getDetalles()) {
            RutinaDetalle nuevoDetalle = new RutinaDetalle();
            nuevoDetalle.setRutina(plantillaSaved);
            nuevoDetalle.setEjercicio(detalleOriginal.getEjercicio());
            nuevoDetalle.setOrden(detalleOriginal.getOrden());
            nuevoDetalle.setSeries(detalleOriginal.getSeries());
            nuevoDetalle.setRepeticiones(detalleOriginal.getRepeticiones());
            nuevoDetalle.setCarga(detalleOriginal.getCarga());
            nuevoDetalle.setDescanso(detalleOriginal.getDescanso());
            nuevoDetalle.setObservacion(detalleOriginal.getObservacion());
            nuevoDetalle.setDia(detalleOriginal.getDia());
            if (detalleOriginal.getCargas() != null) {
                nuevoDetalle.setCargas(new java.util.ArrayList<>(detalleOriginal.getCargas()));
            }
            plantillaSaved.agregarDetalle(nuevoDetalle);
        }

        Rutina resultado = rutinaRepository.save(plantillaSaved);
        return convertirARutinaDTO(resultado);
    }


}
