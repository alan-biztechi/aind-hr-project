package com.aind.hr.repository;

import com.aind.hr.model.entity.Department;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DepartmentRepository {

    List<Department> selectAll();

    Department selectById(@Param("id") Integer id);

    int insert(Department department);

    int update(Department department);

    int delete(@Param("id") Integer id);
}
