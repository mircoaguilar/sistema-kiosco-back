CREATE DATABASE  IF NOT EXISTS `kiosco_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `kiosco_db`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: kiosco_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activa` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Gaseosas',NULL,1),(2,'Golosinas',NULL,1),(3,'Electronica',NULL,1),(4,'Mercaderia',NULL,1),(6,'Carnes',NULL,1),(7,'Panificados',NULL,1),(12,'Prueba',NULL,1);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ventas`
--

DROP TABLE IF EXISTS `detalle_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_ventas` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) DEFAULT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `cantidad` decimal(10,3) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_venta` (`id_venta`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_ventas_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE,
  CONSTRAINT `detalle_ventas_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas`
--

LOCK TABLES `detalle_ventas` WRITE;
/*!40000 ALTER TABLE `detalle_ventas` DISABLE KEYS */;
INSERT INTO `detalle_ventas` VALUES (67,52,1,2.000,3000.00,6000.00),(68,53,2,1.000,2000.00,2000.00),(69,54,4,2.000,600.00,1200.00),(70,55,1,2.000,3000.00,6000.00),(71,55,4,1.000,600.00,600.00),(72,56,1,2.000,3000.00,6000.00),(73,57,1,2.000,3000.00,6000.00),(74,57,2,1.000,2000.00,2000.00);
/*!40000 ALTER TABLE `detalle_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_caja`
--

DROP TABLE IF EXISTS `movimientos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_caja` (
  `id_movimiento` int(11) NOT NULL AUTO_INCREMENT,
  `id_sesion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `concepto` varchar(255) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia') DEFAULT 'efectivo',
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_movimiento`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_caja`
--

LOCK TABLES `movimientos_caja` WRITE;
/*!40000 ALTER TABLE `movimientos_caja` DISABLE KEYS */;
INSERT INTO `movimientos_caja` VALUES (1,11,1,'egreso','Para bolsa',5000.00,'transferencia','2026-04-15 14:06:38'),(2,11,1,'ingreso','Para cambio',5000.00,'efectivo','2026-04-15 14:07:18'),(3,13,1,'egreso','Para bolsa',5000.00,'efectivo','2026-04-18 12:35:49'),(4,13,1,'ingreso','Para cambio',10000.00,'efectivo','2026-04-18 12:37:01'),(5,14,1,'egreso','Compra urgente',1200.00,'efectivo','2026-04-18 13:02:58'),(6,14,1,'ingreso','El cliente devolvio plata',500.00,'efectivo','2026-04-18 13:03:21');
/*!40000 ALTER TABLE `movimientos_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_barras` varchar(50) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `precio_costo` decimal(12,2) NOT NULL,
  `precio_venta` decimal(12,2) NOT NULL,
  `stock` decimal(10,3) NOT NULL DEFAULT 0.000,
  `stock_minimo` decimal(10,3) DEFAULT 1.000,
  `activo` tinyint(4) NOT NULL DEFAULT 1,
  `id_proveedor` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `id_categoria` (`id_categoria`),
  KEY `id_proveedor` (`id_proveedor`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`),
  CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'123456','Coca-Cola 1.5 Litros',1,2000.00,4042.50,10.000,10.000,1,10),(2,'1234567','Fanta',1,1700.00,2310.00,17.000,10.000,1,10),(4,'779123456','Alfajor Guaymallen de Oro',2,350.00,825.00,9.000,5.000,0,11),(5,'6934177708800','Auricular',3,5000.00,1000.00,15.000,10.000,1,NULL),(8,'654321','Fideo tirabuzon',4,1000.00,3300.00,20.000,10.000,1,12),(9,'13245','Mirinda 2.5 litros',1,1500.00,3300.00,12.000,5.000,1,12),(10,'987654321','Pepsi 3 litros',1,2000.00,3850.00,12.000,5.000,1,12);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (10,'Coca Cola','3704576835','Coca@gmail.com','Maipu 2000',1,'2026-04-20 23:13:50'),(11,'Milkaut','123','aprueba@gmail.com',NULL,1,'2026-04-20 23:14:23'),(12,'Pepsi',NULL,NULL,NULL,1,'2026-04-20 23:15:39'),(13,'Terrabusi','3704876921','terrabusi@gmail.com',NULL,1,'2026-04-24 13:16:01');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesiones_caja`
--

DROP TABLE IF EXISTS `sesiones_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones_caja` (
  `id_sesion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `fecha_apertura` datetime DEFAULT current_timestamp(),
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_inicial` decimal(10,2) NOT NULL,
  `monto_final_efectivo` decimal(10,2) DEFAULT NULL,
  `monto_ventas_efectivo` decimal(10,2) DEFAULT 0.00,
  `monto_ventas_digital` decimal(10,2) DEFAULT 0.00,
  `estado` enum('abierta','cerrada') DEFAULT 'abierta',
  PRIMARY KEY (`id_sesion`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `sesiones_caja_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones_caja`
--

LOCK TABLES `sesiones_caja` WRITE;
/*!40000 ALTER TABLE `sesiones_caja` DISABLE KEYS */;
INSERT INTO `sesiones_caja` VALUES (14,1,'2026-04-18 09:59:40','2026-04-18 10:52:14',10000.00,19400.00,8700.00,7500.00,'cerrada'),(15,1,'2026-04-18 10:54:44','2026-04-18 11:02:51',10000.00,23500.00,13500.00,2100.00,'cerrada'),(16,1,'2026-04-18 11:02:58','2026-04-18 11:03:02',10000.00,10000.00,0.00,0.00,'cerrada'),(17,1,'2026-04-18 11:05:04','2026-04-18 11:05:09',1000.00,1500.00,0.00,0.00,'cerrada'),(18,1,'2026-04-18 11:07:10','2026-04-18 11:07:16',1000.00,2000.00,0.00,0.00,'cerrada'),(19,1,'2026-04-18 11:07:28','2026-04-18 11:07:33',2000.00,2000.00,0.00,0.00,'cerrada'),(20,1,'2026-04-18 11:07:45','2026-04-18 11:07:51',2000.00,1000.00,0.00,0.00,'cerrada'),(21,1,'2026-04-20 20:40:11','2026-04-20 21:05:51',10000.00,23000.00,13100.00,2700.00,'cerrada'),(22,1,'2026-04-21 22:14:42','2026-04-21 22:23:24',15000.00,21000.00,6000.00,0.00,'cerrada'),(23,1,'2026-04-21 22:23:36','2026-04-22 11:00:21',10000.00,18000.00,8000.00,0.00,'cerrada');
/*!40000 ALTER TABLE `sesiones_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('administrador','vendedor') DEFAULT 'vendedor',
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Juan Perez','admin','1234','administrador',1,'2026-04-06 17:13:42');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_hora` timestamp NULL DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL,
  `id_sesion` int(11) DEFAULT NULL,
  `total_venta` decimal(12,2) NOT NULL,
  `monto_efectivo` decimal(12,2) DEFAULT 0.00,
  `monto_transferencia` decimal(12,2) DEFAULT 0.00,
  `metodo_pago` enum('efectivo','transferencia','mixto') DEFAULT 'efectivo',
  `monto_pagado` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id_venta`),
  KEY `id_usuario` (`id_usuario`),
  KEY `fk_ventas_sesion` (`id_sesion`),
  CONSTRAINT `fk_ventas_sesion` FOREIGN KEY (`id_sesion`) REFERENCES `sesiones_caja` (`id_sesion`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (52,'2026-04-20 23:40:25',1,21,6000.00,6000.00,0.00,'efectivo',7000.00),(53,'2026-04-20 23:40:31',1,21,2000.00,0.00,2000.00,'transferencia',2000.00),(54,'2026-04-20 23:40:45',1,21,1200.00,500.00,700.00,'mixto',1200.00),(55,'2026-04-20 23:40:58',1,21,6600.00,6600.00,0.00,'efectivo',8000.00),(56,'2026-04-22 01:19:07',1,22,6000.00,6000.00,0.00,'efectivo',7000.00),(57,'2026-04-22 01:23:56',1,23,8000.00,8000.00,0.00,'efectivo',10000.00);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-24 15:41:45
