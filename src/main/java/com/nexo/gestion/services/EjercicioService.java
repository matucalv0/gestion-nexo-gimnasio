package com.nexo.gestion.services;

import com.nexo.gestion.dto.EjercicioDTO;
import com.nexo.gestion.entity.Ejercicio;
import com.nexo.gestion.entity.GrupoMuscular;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.EjercicioRepository;
import com.nexo.gestion.repository.GrupoMuscularRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EjercicioService {
    private final EjercicioRepository ejercicioRepository;
    private final GrupoMuscularRepository grupoMuscularRepository;

    public EjercicioService(EjercicioRepository ejercicioRepository, GrupoMuscularRepository grupoMuscularRepository) {
        this.ejercicioRepository = ejercicioRepository;
        this.grupoMuscularRepository = grupoMuscularRepository;
    }

    private EjercicioDTO convertirAEjercicioDTO(Ejercicio ejercicio) {
        return new EjercicioDTO(
                ejercicio.getIdEjercicio(),
                ejercicio.getNombre(),
                ejercicio.getDescripcion(),
                ejercicio.getVideo(),
                ejercicio.getGrupoMuscular().getIdGrupo());
    }

    public EjercicioDTO registrarEjercicio(EjercicioDTO ejercicioDTO) {
        if (ejercicioRepository.existsByNombre(ejercicioDTO.nombre())) {
            throw new ObjetoDuplicadoException(ejercicioDTO.nombre());
        }

        if (ejercicioDTO.idGrupoMuscular() == null) {
            throw new IllegalArgumentException("El ID del grupo muscular no puede ser nulo");
        }

        GrupoMuscular grupoMuscular = grupoMuscularRepository.findById(ejercicioDTO.idGrupoMuscular())
                .orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(ejercicioDTO.idGrupoMuscular())));
        Ejercicio ejercicio = new Ejercicio(ejercicioDTO.nombre(), grupoMuscular, ejercicioDTO.video(),
                ejercicioDTO.descripcion());

        Ejercicio guardado = ejercicioRepository.save(ejercicio);
        return convertirAEjercicioDTO(guardado);
    }

    public List<EjercicioDTO> buscarEjercicios() {
        List<EjercicioDTO> ejercicios = new ArrayList<>();
        for (Ejercicio ejercicio : ejercicioRepository.findAll()) {
            EjercicioDTO ejercicioConvertido = convertirAEjercicioDTO(ejercicio);
            ejercicios.add(ejercicioConvertido);
        }
        return ejercicios;
    }

    public EjercicioDTO actualizarEjercicio(Integer id, EjercicioDTO ejercicioDTO) {
        Ejercicio ejercicio = ejercicioRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Ejercicio no encontrado con ID: " + id));

        // Update basic fields
        ejercicio.setNombre(ejercicioDTO.nombre());
        ejercicio.setDescripcion(ejercicioDTO.descripcion());
        ejercicio.setVideo(ejercicioDTO.video());

        // Update Muscle Group if changed
        if (ejercicioDTO.idGrupoMuscular() != null &&
                !ejercicioDTO.idGrupoMuscular().equals(ejercicio.getGrupoMuscular().getIdGrupo())) {
            GrupoMuscular nuevoGrupo = grupoMuscularRepository.findById(ejercicioDTO.idGrupoMuscular())
                    .orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(ejercicioDTO.idGrupoMuscular())));
            ejercicio.setGrupoMuscular(nuevoGrupo);
        }

        Ejercicio actualizado = ejercicioRepository.save(ejercicio);
        return convertirAEjercicioDTO(actualizado);
    }

    public void eliminarEjercicio(Integer id) {
        if (!ejercicioRepository.existsById(id)) {
            throw new ObjetoNoEncontradoException("Ejercicio no encontrado con ID: " + id);
        }
        ejercicioRepository.deleteById(id);
    }
}
