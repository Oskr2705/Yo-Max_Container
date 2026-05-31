package com.example.acceso.controller;

import com.example.acceso.model.Categoria;
import com.example.acceso.model.Producto;
import com.example.acceso.model.VentaWeb;
import com.example.acceso.service.CategoriaService;
import com.example.acceso.service.ProductoService;
import com.example.acceso.service.VentaWebService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/ventas_web")
public class VentaWebController {

    private final VentaWebService ventaWebService;
    private final ProductoService productoService;
    private final CategoriaService categoriaService;

    @Autowired
    public VentaWebController(VentaWebService ventaWebService, ProductoService productoService, CategoriaService categoriaService) {
        this.ventaWebService = ventaWebService;
        this.productoService = productoService;
        this.categoriaService = categoriaService;
    }

    @GetMapping("")
    public String listarVentasWeb() {
        return "ventas-web";
    }

    @GetMapping("/modificar/{id}")
    public String showModificarVentaWeb(@PathVariable Long id, Model model) {
        List<Categoria> categoriasActivas = categoriaService.listarCategoriasActivas();
        List<Producto> productosActivos = productoService.listarProductosActivos();
        Map<Categoria, List<Producto>> productosPorCategoria = categoriasActivas.stream()
                .collect(Collectors.toMap(
                        categoria -> categoria,
                        categoria -> productosActivos.stream()
                                .filter(p -> p.getCategoria() != null && p.getCategoria().getId().equals(categoria.getId()))
                                .collect(Collectors.toList())
                ));
        model.addAttribute("productosPorCategoria", productosPorCategoria);
        model.addAttribute("ventaWebId", id);
        return "modificar-venta-web";
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarVentaWeb(@RequestBody VentaWeb ventaWeb) {
        try {
            VentaWeb ventaGuardada = ventaWebService.guardarVentaWeb(ventaWeb);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pedido web registrado con éxito", "ventaWebId", ventaGuardada.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarVentasWebApi() {
        List<VentaWeb> ventas = ventaWebService.listarTodasLasVentasWeb();
        return ResponseEntity.ok(Map.of("success", true, "data", ventas));
    }

    @PostMapping("/api/procesar/{id}")
    @ResponseBody
    public ResponseEntity<?> procesarVentaWeb(@PathVariable Long id) {
        try {
            ventaWebService.procesarVentaWeb(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta procesada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error al procesar la venta: " + e.getMessage()));
        }
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarVentaWeb(@PathVariable Long id) {
        try {
            ventaWebService.eliminarVentaWeb(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta web eliminada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error al eliminar la venta web: " + e.getMessage()));
        }
    }

    @GetMapping("/api/detalle/{id}")
    @ResponseBody
    public ResponseEntity<?> obtenerDetalleVentaWeb(@PathVariable Long id) {
        return ventaWebService.obtenerVentaWebPorId(id)
                .map(ventaWeb -> ResponseEntity.ok(Map.of("success", true, "data", ventaWeb)))
                .orElse(ResponseEntity.badRequest().body(Map.of("success", false, "message", "Venta web no encontrada")));
    }

    @PutMapping("/api/actualizar/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarVentaWeb(@PathVariable Long id, @RequestBody VentaWeb ventaWeb) {
        try {
            VentaWeb actualizada = ventaWebService.actualizarVentaWeb(id, ventaWeb);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta web actualizada con éxito.", "data", actualizada));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Error al actualizar la venta web: " + e.getMessage()));
        }
    }
}
