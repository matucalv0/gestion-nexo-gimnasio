package com.nexo.gestion.services;

import com.nexo.gestion.dto.ProductoCreateDTO;
import com.nexo.gestion.dto.ProductoDTO;
import com.nexo.gestion.dto.ProductoPatchDTO;
import com.nexo.gestion.entity.Producto;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductoService {
    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository){
        this.productoRepository = productoRepository;
    }

    private ProductoDTO convertirAProductoDTO(Producto producto) {
        return new ProductoDTO(
                producto.getIdProducto(),
                producto.getNombre(),
                producto.getPrecioSugerido(),
                producto.getStock(),
                producto.isActivo()
        );
    }

    public ProductoDTO registrarProducto(ProductoCreateDTO productoCreateDTO) {
        if (productoRepository.existsByNombre(productoCreateDTO.getNombre())) {
            throw new ObjetoDuplicadoException(productoCreateDTO.getNombre());
        }

        Producto producto = new Producto(productoCreateDTO.getNombre(), productoCreateDTO.getPrecioSugerido(), productoCreateDTO.getStock());

        Producto guardado =  productoRepository.save(producto);
        return convertirAProductoDTO(guardado);
    }

    public ProductoDTO bajaProducto(Integer id){
        Producto producto = productoRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));
        producto.setActivo(false);
        Producto guardado = productoRepository.save(producto);
        return convertirAProductoDTO(guardado);
    }

    public List<ProductoDTO> buscarProductos(){
        List<ProductoDTO> productos = new ArrayList<>();
        for (Producto producto: productoRepository.findAll()){
            ProductoDTO productoConvertido = convertirAProductoDTO(producto);
            productos.add(productoConvertido);
        }
        return productos;
    }

    public ProductoDTO buscarProductoPorId(Integer id){
        Producto guardado =  productoRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));
        return convertirAProductoDTO(guardado);
    }

    public ProductoDTO patchProducto(Integer id, ProductoPatchDTO productoDTO){
        Producto producto = productoRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));

        if (productoDTO.getStock() != null){producto.setStock(producto.getStock());}
        if (productoDTO.getNombre() != null){producto.setNombre(productoDTO.getNombre());}
        if (productoDTO.getPrecioSugerido() != null){producto.setPrecioSugerido(productoDTO.getPrecioSugerido());}
        if (productoDTO.getActivo() != null){producto.setActivo(productoDTO.getActivo());}

        Producto guardado =  productoRepository.save(producto);
        return convertirAProductoDTO(guardado);
    }






}
