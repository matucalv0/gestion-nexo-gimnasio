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
        return new RutinaDetalleDTO(
                detalle.getIdDetalle(),
                detalle.getEjercicio().getIdEjercicio(),
                detalle.getEjercicio().getNombre(),
                detalle.getEjercicio().getVideo(),
                detalle.getEjercicio().getGrupoMuscular() != null
                        ? detalle.getEjercicio().getGrupoMuscular().getIdGrupo()
                        : null,
                detalle.getOrden(),
                detalle.getSeries(),
                detalle.getRepeticiones(),
                detalle.getCarga(),
                detalle.getDescanso(),
                detalle.getObservacion(),
                detalle.getDia());
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
        // DEPRECATED: Use crearRutinaConDetalles instead
        // This method is kept for backward compatibility during migration
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
        Rutina rutina = rutinaRepository.findById(idRutina)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Rutina no encontrada con ID: " + idRutina));
        return convertirARutinaDTO(rutina);
    }

    // 🆕 ACTUALIZAR rutina completa (reemplaza detalles)
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

        // Reemplazar detalles: borrar viejos, agregar nuevos
        rutina.getDetalles().clear();
        if (dto.detalles() != null && !dto.detalles().isEmpty()) {
            for (RutinaDetalleRequestDTO d : dto.detalles()) {
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

        RutinaDetalle actualizada = rutinaDetalleRepository.save(detalle);
        return convertirADetalleDTO(actualizada);
    }

    // DELETE: Methods removed legacy EjercicioRutina dependency. Use
    // crearRutinaConDetalles.
    @Transactional(readOnly = true)
    public java.util.List<RutinaDTO> buscarRutinas() {
        return rutinaRepository.findAll().stream()
                .map(this::convertirARutinaResumenDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    private RutinaDTO convertirARutinaResumenDTO(Rutina rutina) {
        // Returns DTO without details for list view performance
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
