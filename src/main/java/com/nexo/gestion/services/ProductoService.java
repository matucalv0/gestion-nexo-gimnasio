package com.nexo.gestion.services;

import com.nexo.gestion.dto.ProductoCreateDTO;
import com.nexo.gestion.dto.ProductoPatchDTO;
import com.nexo.gestion.entity.Producto;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductoService {
    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository){
        this.productoRepository = productoRepository;
    }

    public Producto registrarProducto(ProductoCreateDTO productoCreateDTO) {
        if (productoRepository.existsByNombre(productoCreateDTO.getNombre())) {
            throw new ObjetoDuplicadoException(productoCreateDTO.getNombre());
        }

        Producto producto = new Producto(productoCreateDTO.getNombre(), productoCreateDTO.getPrecio_sugerido(), productoCreateDTO.getStock());

        return productoRepository.save(producto);
    }

    public Producto bajaProducto(Integer id){
        Producto producto = productoRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));
        producto.setActivo(false);
        return productoRepository.save(producto);
    }

    public List<Producto> buscarProductos(){
        return productoRepository.findAll();
    }

    public Producto buscarProductoPorId(Integer id){
        return productoRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));
    }

    public Producto patchProducto(Integer id, ProductoPatchDTO productoDTO){
        Producto producto = productoRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));

        if (productoDTO.getStock() != null){producto.setStock(producto.getStock());}
        if (productoDTO.getNombre() != null){producto.setNombre(productoDTO.getNombre());}
        if (productoDTO.getPrecio_sugerido() != null){producto.setPrecio_sugerido(productoDTO.getPrecio_sugerido());}
        if (productoDTO.getActivo() != null){producto.setActivo(productoDTO.getActivo());}

        return productoRepository.save(producto);
    }






}
