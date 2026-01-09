package com.nexo.gestion.services;

import com.nexo.gestion.dto.EjercicioDTO;
import com.nexo.gestion.dto.ProductoDTO;
import com.nexo.gestion.entity.Ejercicio;
import com.nexo.gestion.entity.GrupoMuscular;
import com.nexo.gestion.entity.Producto;
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

    public EjercicioService(EjercicioRepository ejercicioRepository, GrupoMuscularRepository grupoMuscularRepository){
        this.ejercicioRepository = ejercicioRepository;
        this.grupoMuscularRepository = grupoMuscularRepository;
    }

    private EjercicioDTO convertirAEjercicioDTO(Ejercicio ejercicio){
        return new EjercicioDTO(
                ejercicio.getNombre(),
                ejercicio.getDescripcion(),
                ejercicio.getVideo(),
                ejercicio.getGrupoMuscular().getId_grupo()
        );
    }

    public EjercicioDTO registrarEjercicio(EjercicioDTO ejercicioDTO){
        if (ejercicioRepository.existsByNombre(ejercicioDTO.nombre())){
            throw new ObjetoDuplicadoException(ejercicioDTO.nombre());
        }

        GrupoMuscular grupoMuscular = grupoMuscularRepository.findById(ejercicioDTO.idGrupoMuscular()).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(ejercicioDTO.idGrupoMuscular())));
        Ejercicio ejercicio = new Ejercicio(ejercicioDTO.nombre(), grupoMuscular, ejercicioDTO.video(), ejercicioDTO.descripcion());

        Ejercicio guardado = ejercicioRepository.save(ejercicio);
        return convertirAEjercicioDTO(guardado);
    }

    public List<EjercicioDTO> buscarEjercicios(){
        List<EjercicioDTO> ejercicios = new ArrayList<>();
        for (Ejercicio ejercicio: ejercicioRepository.findAll()){
            EjercicioDTO ejercicioConvertido = convertirAEjercicioDTO(ejercicio);
            ejercicios.add(ejercicioConvertido);
        }
        return ejercicios;
    }
}


