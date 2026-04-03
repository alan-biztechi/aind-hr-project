package com.aind.hr.repository;

import com.aind.hr.model.entity.Employee;
import com.aind.hr.model.response.EmployeeResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmployeeRepository {

    List<Employee> selectAll();

    Employee selectById(@Param("id") Integer id);

    EmployeeResponse selectWithDepartmentById(@Param("id") Integer id);

    List<EmployeeResponse> selectAllWithDepartment();

    List<Employee> selectByDepartmentId(@Param("departmentId") Integer departmentId);

    int insert(Employee employee);

    int update(Employee employee);

    int delete(@Param("id") Integer id);
}
