package com.nexo.gestion.services;

import com.nexo.gestion.dto.EjercicioDTO;
import com.nexo.gestion.dto.RutinaDTO;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RutinaService {
    private final RutinaRepository rutinaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SocioRepository socioRepository;
    private final EjercicioRepository ejercicioRepository;
    private final EjercicioRutinaRepository ejercicioRutinaRepository;

    public RutinaService(RutinaRepository rutinaRepository, EmpleadoRepository empleadoRepository, SocioRepository socioRepository, EjercicioRepository ejercicioRepository, EjercicioRutinaRepository ejercicioRutinaRepository){
        this.rutinaRepository = rutinaRepository;
        this.empleadoRepository = empleadoRepository;
        this.socioRepository = socioRepository;
        this.ejercicioRepository = ejercicioRepository;
        this.ejercicioRutinaRepository = ejercicioRutinaRepository;

    }

    public RutinaDTO convertirARutinaDTO(Rutina rutina){
        return new RutinaDTO(rutina.getNombre(), rutina.getDescripcion(), rutina.getEmpleado().getDni(), rutina.getSocio() != null ? rutina.getSocio().getDni() : null);
    }

    private EjercicioDTO convertirAEjercicioDTO(Ejercicio ejercicio){
        return new EjercicioDTO(
                ejercicio.getNombre(),
                ejercicio.getDescripcion(),
                ejercicio.getVideo(),
                ejercicio.getGrupoMuscular().getId_grupo()
        );
    }


    @Transactional
    public RutinaDTO crearRutina(RutinaDTO rutina){
        if (rutinaRepository.existsByNombre(rutina.nombre())){
            throw new ObjetoDuplicadoException("Ya existe una rutina con el nombre " + rutina.nombre());
        }

        Empleado empleado = empleadoRepository.findById(rutina.dniEmpleado()).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontró el empleado con el dni " + rutina.dniEmpleado()));
        Socio socio = null;

        if (rutina.dniSocio() != null){
            socio = socioRepository.findById(rutina.dniSocio()).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontró el socio con el dni " + rutina.dniSocio()));
        }


        Rutina nuevaRutina = new Rutina(rutina.nombre(), rutina.descripcion(), empleado, socio);
        Rutina guardada = rutinaRepository.save(nuevaRutina);
        return convertirARutinaDTO(guardada);

    }

    @Transactional
    public EjercicioDTO agregarEjercicio(Integer idRutina, Integer idEjercicio){
        Rutina rutina = rutinaRepository.findById(idRutina).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontro la rutina " + idRutina));
        Ejercicio ejercicio = ejercicioRepository.findById(idEjercicio).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontro el ejercicio " + idEjercicio));

        EjercicioRutina ejercicioRutina = new EjercicioRutina(ejercicio, rutina);
        EjercicioRutina guardada = ejercicioRutinaRepository.save(ejercicioRutina);
        return convertirAEjercicioDTO(guardada.getEjercicio());
    }

    @Transactional
    public EjercicioDTO eliminarEjercicio(Integer idRutina, Integer idEjercicio) {
        Rutina rutina = rutinaRepository.findById(idRutina).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontro la rutina " + idRutina));
        Ejercicio ejercicio = ejercicioRepository.findById(idEjercicio).orElseThrow(() -> new ObjetoNoEncontradoException("No se encontro el ejercicio " + idEjercicio));

        ejercicioRutinaRepository.deleteById(new EjercicioRutinaId(ejercicio.getId_ejercicio(), rutina.getId_rutina()));
        return convertirAEjercicioDTO(ejercicio);



    }
}
