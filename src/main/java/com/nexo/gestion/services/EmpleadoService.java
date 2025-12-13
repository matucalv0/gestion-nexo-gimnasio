package com.nexo.gestion.services;

import com.nexo.gestion.dto.EmpleadoDTO;
import com.nexo.gestion.dto.PuestoDTO;
import com.nexo.gestion.entity.Empleado;
import com.nexo.gestion.entity.Puesto;

import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.EmpleadoRepository;
import com.nexo.gestion.repository.PuestoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EmpleadoService {
    private final EmpleadoRepository empleadoRepository;
    private final PuestoRepository puestoRepository;

    public EmpleadoService(PuestoRepository puestoRepository, EmpleadoRepository empleadoRepository){
        this.empleadoRepository = empleadoRepository;
        this.puestoRepository = puestoRepository;

    }

    private EmpleadoDTO convertirAEmpleadoDTO(Empleado empleado) {
        return new EmpleadoDTO(
                empleado.getDni(),
                empleado.getNombre(),
                empleado.getTelefono(),
                empleado.getEmail(),
                empleado.getFecha_nacimiento(),
                empleado.isActivo(),
                empleado.getPuesto().getId_puesto()
        );
    }

    public EmpleadoDTO registrarEmpleado(EmpleadoDTO empleadoDTO){
        if(empleadoRepository.existsById(empleadoDTO.dni())){
            throw new ObjetoNoEncontradoException(empleadoDTO.dni());
        }

        Puesto puesto = puestoRepository.findById(empleadoDTO.id_puesto()).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(empleadoDTO.id_puesto())));

        Empleado empleado = new Empleado(empleadoDTO.dni(), empleadoDTO.nombre(), empleadoDTO.telefono(), empleadoDTO.email(), empleadoDTO.fecha_nacimiento(), puesto);
        Empleado guardado = empleadoRepository.save(empleado);
        return convertirAEmpleadoDTO(guardado);
    }

    public EmpleadoDTO bajaEmpleado(String dni){
        Empleado empleado = empleadoRepository.findById(dni).orElseThrow(()-> new ObjetoNoEncontradoException(dni));

        empleado.setActivo(false);
        Empleado guardado = empleadoRepository.save(empleado);
        return convertirAEmpleadoDTO(empleado);
    }

    public EmpleadoDTO patchEmpleado(String dni, EmpleadoDTO empleadoDTO){
        Empleado empleado = empleadoRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));

        if (empleadoDTO.email() != null) { empleado.setEmail(empleadoDTO.email());}
        if (empleadoDTO.telefono() != null) { empleado.setTelefono(empleadoDTO.telefono());}
        if (empleadoDTO.activo() != null) { empleado.setActivo(empleadoDTO.activo());}
        if (empleadoDTO.id_puesto() != null) {
            Puesto puesto = puestoRepository.findById(empleadoDTO.id_puesto()).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(empleadoDTO.id_puesto())));
            empleado.setPuesto(puesto);
        }

        Empleado guardado = empleadoRepository.save(empleado);
        return convertirAEmpleadoDTO(guardado);
    }

    public EmpleadoDTO buscarEmpleadoPorDni(String dni){
        Empleado empleado = empleadoRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
        return convertirAEmpleadoDTO(empleado);
    }

    public List<EmpleadoDTO> buscarEmpleados(){
        List<EmpleadoDTO> empleadosDTO = new ArrayList<>();

        for (Empleado empleado: empleadoRepository.findAll()){
            EmpleadoDTO empleadoDTO = convertirAEmpleadoDTO(empleado);
            empleadosDTO.add(empleadoDTO);
        }

        return empleadosDTO;
    }









}
